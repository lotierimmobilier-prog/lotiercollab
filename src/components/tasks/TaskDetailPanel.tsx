import { useState, useEffect, useRef } from 'react';
import { X, Send, Plus, ChevronDown, Paperclip, CircleCheck as CheckCircle2, Circle, Ban, Trash2, RefreshCw } from 'lucide-react';
import { useTaskDetail } from '../../hooks/useStore';
import { MemberAvatar } from '../common/MemberAvatar';
import { MultiMemberPicker } from '../common/MultiMemberPicker';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import type { Project, Member, TaskStatus, TaskPriority, TaskRecurrence } from '../../types';
import { formatDateTime, RECURRENCE_OPTIONS, computeNextRecurrenceDate } from '../../lib/dateUtils';

interface Props {
  taskId: string | null;
  onClose: () => void;
  projects: Project[];
  members: Member[];
  currentMemberId?: string;
  readOnly?: boolean;
  onDeleteTask?: (taskId: string) => void;
  kanbanColumns?: { id: string; label: string }[];
}

const DEFAULT_STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'todo', label: 'À faire', icon: <Circle className="w-3.5 h-3.5 text-gray-400" /> },
  { value: 'doing', label: 'En cours', icon: <ChevronDown className="w-3.5 h-3.5 text-blue-500" /> },
  { value: 'done', label: 'Terminé', icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> },
  { value: 'blocked', label: 'Bloqué', icon: <Ban className="w-3.5 h-3.5 text-red-500" /> },
];

const DONE_STATUSES = ['done', 'terminé', 'termine', 'closed', 'fermé', 'ferme', 'completed'];

function isDoneStatus(status: string): boolean {
  return DONE_STATUSES.some(s => status.toLowerCase().includes(s));
}

export function TaskDetailPanel({ taskId, onClose, projects, members, currentMemberId, readOnly = false, onDeleteTask, kanbanColumns }: Props) {
  const { task, comments, attachments, subtasks, loading, addComment, updateTask, createSubtask } = useTaskDetail(taskId);
  const [commentBody, setCommentBody] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const statusOptions = kanbanColumns
    ? kanbanColumns.map(c => ({ value: c.id, label: c.label, icon: <Circle className="w-3.5 h-3.5 text-gray-400" /> }))
    : DEFAULT_STATUS_OPTIONS;

  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescriptionValue(task.description ?? '');
    }
  }, [task?.id]);

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleTitleBlur = async () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue !== task?.title) {
      await updateTask({ title: titleValue.trim() });
    }
  };

  const handleDescriptionBlur = async () => {
    if (descriptionValue !== (task?.description ?? '')) {
      await updateTask({ description: descriptionValue });
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (readOnly || !task) return;

    if (task.recurrence && isDoneStatus(newStatus)) {
      const nextDate = computeNextRecurrenceDate(new Date(), task.recurrence as TaskRecurrence);
      await updateTask({
        status: 'todo',
        due_date: nextDate,
        next_recurrence_date: nextDate,
      });
    } else {
      await updateTask({ status: newStatus });
    }
  };

  const handleSendComment = async () => {
    if (!commentBody.trim() || !currentMemberId) return;
    setSendingComment(true);
    await addComment(commentBody.trim(), currentMemberId);
    setCommentBody('');
    setSendingComment(false);
  };

  const handleAddSubtask = async () => {
    if (!subtaskTitle.trim()) return;
    await createSubtask(subtaskTitle.trim(), null);
    setSubtaskTitle('');
    setShowSubtaskInput(false);
  };

  if (!taskId) return null;

  const recurrenceLabel = task?.recurrence
    ? RECURRENCE_OPTIONS.find(o => o.value === task.recurrence)?.label
    : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="w-[420px] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Détail de la tâche</span>
          <div className="flex items-center gap-1">
            {!readOnly && onDeleteTask && task && (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 mr-1">
                  <span className="text-xs text-red-500">Supprimer ?</span>
                  <button
                    onClick={() => { onDeleteTask(task.id); onClose(); }}
                    className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-colors"
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-2 py-0.5 rounded transition-colors"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors group"
                  title="Supprimer la tâche"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500 transition-colors" />
                </button>
              )
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {loading || !task ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Chargement...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-5">
              {!readOnly && editingTitle ? (
                <input
                  ref={titleRef}
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={e => e.key === 'Enter' && handleTitleBlur()}
                  className="w-full text-base font-semibold text-gray-900 border-b-2 border-[#1A3A5C] outline-none pb-1 bg-transparent"
                />
              ) : (
                <h2
                  className={`text-base font-semibold text-gray-900 rounded px-1 -mx-1 py-0.5 transition-colors ${!readOnly ? 'cursor-text hover:bg-gray-50' : ''}`}
                  onClick={() => !readOnly && setEditingTitle(true)}
                >
                  {task.title}
                </h2>
              )}

              {task.recurrence && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-blue-700">{recurrenceLabel}</span>
                    {task.next_recurrence_date && (
                      <span className="text-xs text-blue-500 ml-2">
                        — prochaine le {new Date(task.next_recurrence_date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-medium">Statut</p>
                  <Select value={task.status} onValueChange={handleStatusChange} disabled={readOnly}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="flex items-center gap-2">
                            {o.icon}
                            {o.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-medium">Priorité</p>
                  <Select value={task.priority} onValueChange={v => !readOnly && updateTask({ priority: v as TaskPriority })} disabled={readOnly}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <p className="text-xs text-gray-400 font-medium">Responsables</p>
                  <MultiMemberPicker
                    members={members}
                    selectedIds={(task.assignees ?? []).map(m => m.id).length > 0
                      ? (task.assignees ?? []).map(m => m.id)
                      : task.assigned_to ? [task.assigned_to] : []}
                    onChange={ids => !readOnly && updateTask({ assigneeIds: ids, assigned_to: ids[0] ?? null })}
                    disabled={readOnly}
                    size="sm"
                    placeholder="Non assigné"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-medium">Projet</p>
                  <Select value={task.project_id ?? '__none__'} onValueChange={v => !readOnly && updateTask({ project_id: v === '__none__' ? null : v })} disabled={readOnly}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucun</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                            {p.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-medium">Date d'échéance</p>
                  <Input
                    type="date"
                    value={task.due_date ?? ''}
                    onChange={e => !readOnly && updateTask({ due_date: e.target.value || null })}
                    className="h-8 text-xs"
                    readOnly={readOnly}
                  />
                </div>

                {!readOnly && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Récurrence
                    </p>
                    <Select
                      value={task.recurrence ?? '__none__'}
                      onValueChange={v => updateTask({ recurrence: v === '__none__' ? null : v as TaskRecurrence })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Aucune récurrence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune récurrence</SelectItem>
                        {RECURRENCE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {task.recurrence && (
                      <p className="text-xs text-gray-400">
                        Quand la tâche sera terminée, elle sera remise en "À traiter" avec la prochaine échéance calculée.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-gray-400 font-medium">Description</p>
                <Textarea
                  value={descriptionValue}
                  onChange={e => !readOnly && setDescriptionValue(e.target.value)}
                  onBlur={!readOnly ? handleDescriptionBlur : undefined}
                  placeholder={readOnly ? '' : 'Ajouter une description...'}
                  rows={3}
                  className="text-sm resize-none"
                  readOnly={readOnly}
                />
              </div>

              {subtasks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Sous-tâches ({subtasks.length})</p>
                  <div className="space-y-1.5">
                    {subtasks.map(st => (
                      <div key={st.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <StatusBadge status={st.status} />
                        <span className="text-xs text-gray-700 flex-1">{st.title}</span>
                        {st.assignee && <MemberAvatar member={st.assignee} size="sm" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!readOnly && (showSubtaskInput ? (
                <div className="flex gap-2">
                  <Input
                    value={subtaskTitle}
                    onChange={e => setSubtaskTitle(e.target.value)}
                    placeholder="Titre de la sous-tâche..."
                    className="h-8 text-xs flex-1"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddSubtask();
                      if (e.key === 'Escape') setShowSubtaskInput(false);
                    }}
                  />
                  <Button size="sm" variant="outline" onClick={() => setShowSubtaskInput(false)} className="h-8 text-xs">Annuler</Button>
                  <Button size="sm" onClick={handleAddSubtask} className="h-8 text-xs bg-[#1A3A5C] hover:bg-[#142d47] text-white">Ajouter</Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSubtaskInput(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1A3A5C] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Créer une sous-tâche
                </button>
              ))}

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Pièces jointes ({attachments.length})</p>
                  <div className="space-y-1.5">
                    {attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <a href={att.file_url} target="_blank" rel="noreferrer" className="text-xs text-[#1A3A5C] hover:underline flex-1 truncate">
                          {att.file_name}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 px-5 pt-4 pb-2">
              <p className="text-xs text-gray-400 font-medium mb-3">
                Commentaires {comments.length > 0 && `(${comments.length})`}
              </p>

              {comments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Aucun commentaire pour le moment</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {comments.map(c => {
                    const author = members.find(m => m.id === c.author_id) ?? c.author ?? null;
                    return (
                      <div key={c.id} className="flex gap-2.5">
                        <MemberAvatar member={author} size="sm" className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-gray-800">{author?.full_name ?? 'Inconnu'}</span>
                            <span className="text-xs text-gray-400">{formatDateTime(c.created_at)}</span>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>
          </div>
        )}

        {task && (
          <div className="border-t border-gray-100 p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Textarea
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                placeholder="Écrire un commentaire..."
                rows={2}
                className="text-sm resize-none flex-1"
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendComment();
                }}
              />
              <Button
                onClick={handleSendComment}
                disabled={!commentBody.trim() || sendingComment || !currentMemberId}
                className="self-end bg-[#1A3A5C] hover:bg-[#142d47] text-white h-9 px-3"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Cmd+Entrée pour envoyer</p>
          </div>
        )}
      </div>
    </div>
  );
}
