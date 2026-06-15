import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Calendar, Trash2, Zap, UserPen, Check, X, Search } from 'lucide-react';
import type { Task, Member } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';
import { ProjectBadge } from '../common/ProjectBadge';
import { formatRelativeDate } from '../../lib/dateUtils';
import { priorityConfig } from '../../lib/priorityUtils';

interface Props {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
  onDelete?: (taskId: string) => void;
  onToggleUrgent?: (taskId: string) => void;
  members?: Member[];
  onChangeAssignees?: (taskId: string, memberIds: string[]) => void;
}

export function TaskCard({ task, onClick, isDragging, onDelete, onToggleUrgent, members, onChangeAssignees }: Props) {
  const { label, status: dateStatus } = formatRelativeDate(task.due_date);
  const prio = priorityConfig[task.priority];
  const isUrgent = task.priority === 'urgent';
  const isUrgentOrHigh = task.priority === 'urgent' || task.priority === 'high';
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [localAssigneeIds, setLocalAssigneeIds] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const canEdit = !!(onDelete || onChangeAssignees);

  useEffect(() => {
    if (showAssigneePicker) {
      const current = (task.assignees ?? []).map(m => m.id).length > 0
        ? (task.assignees ?? []).map(m => m.id)
        : task.assigned_to ? [task.assigned_to] : [];
      setLocalAssigneeIds(current);
      setAssigneeSearch('');
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showAssigneePicker, task.assignees, task.assigned_to]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenu(null);
    onDelete?.(task.id);
  };

  const handleOpenAssigneePicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenu(null);
    setShowAssigneePicker(true);
  };

  const handleUrgentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleUrgent?.(task.id);
  };

  const handleApplyAssignees = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeAssignees?.(task.id, localAssigneeIds);
    setShowAssigneePicker(false);
  };

  const toggleAssignee = (id: string) => {
    setLocalAssigneeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredMembers = (members ?? []).filter(m =>
    m.full_name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  return (
    <>
      <div
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className={`group/card relative bg-white rounded-lg border border-gray-200/80 hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer border-l-[3px] ${
          isUrgentOrHigh ? prio.border : 'border-l-transparent'
        } ${isDragging ? 'shadow-lg rotate-1 opacity-90' : ''}`}
      >
        {isUrgent && (
          <div className="absolute -top-1.5 -right-1.5 z-10">
            <span className="flex items-center gap-0.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm uppercase tracking-wide">
              <Zap className="w-2.5 h-2.5 fill-white" />
              Urgent
            </span>
          </div>
        )}

        <div className="p-3">
          <div className="flex items-start gap-1.5">
            <p className="flex-1 text-sm font-medium text-gray-900 leading-snug line-clamp-2">{task.title}</p>
            {onToggleUrgent && (
              <button
                onClick={handleUrgentClick}
                onPointerDown={e => e.stopPropagation()}
                title={isUrgent ? 'Retirer l\'urgence' : 'Marquer comme urgent'}
                className={`flex-shrink-0 mt-0.5 p-0.5 rounded transition-all duration-150 ${
                  isUrgent
                    ? 'text-red-500 opacity-100'
                    : 'text-gray-300 opacity-0 group-hover/card:opacity-100 hover:text-red-400'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${isUrgent ? 'fill-red-500' : ''}`} />
              </button>
            )}
          </div>

          {task.project && (
            <div className="mt-2">
              <ProjectBadge project={task.project} size="sm" />
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {label && (
                <span className={`flex items-center gap-1 text-xs ${
                  dateStatus === 'overdue' ? 'text-red-500 font-medium' :
                  dateStatus === 'soon' || dateStatus === 'today' ? 'text-orange-500 font-medium' :
                  'text-gray-400'
                }`}>
                  <Calendar className="w-3 h-3" />
                  {label}
                </span>
              )}
              {task.comment_count !== undefined && task.comment_count > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MessageSquare className="w-3 h-3" />
                  {task.comment_count}
                </span>
              )}
            </div>
            <div className="flex items-center">
              {(() => {
                const list = task.assignees && task.assignees.length > 0
                  ? task.assignees
                  : task.assignee ? [task.assignee] : [];
                if (list.length === 0) return null;
                const visible = list.slice(0, 3);
                const extra = list.length - visible.length;
                return (
                  <div className="flex items-center">
                    {visible.map((m, i) => (
                      <div key={m.id} className="ring-1 ring-white rounded-full" style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: i }}>
                        <MemberAvatar member={m} size="sm" />
                      </div>
                    ))}
                    {extra > 0 && (
                      <div className="ring-1 ring-white rounded-full w-6 h-6 flex items-center justify-center bg-gray-200 text-[10px] font-bold text-gray-600 ml-[-6px]">
                        +{extra}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {menu && canEdit && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setMenu(null)}
            onContextMenu={e => { e.preventDefault(); setMenu(null); }}
          />
          <div
            ref={menuRef}
            className="fixed z-[61] bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[180px] animate-in fade-in-0 zoom-in-95 duration-100"
            style={{ top: menu.y, left: menu.x }}
          >
            {onChangeAssignees && members && (
              <button
                onClick={handleOpenAssigneePicker}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserPen className="w-3.5 h-3.5 text-gray-400" />
                Changer le responsable
              </button>
            )}
            {onDelete && onChangeAssignees && members && (
              <div className="my-1 border-t border-gray-100" />
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            )}
          </div>
        </>
      )}

      {showAssigneePicker && members && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/10"
            onClick={() => setShowAssigneePicker(false)}
          />
          <div
            ref={pickerRef}
            className="fixed z-[61] bg-white rounded-xl shadow-2xl border border-gray-200 w-64 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-700">Changer le responsable</span>
              <button
                onClick={() => setShowAssigneePicker(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={assigneeSearch}
                  onChange={e => setAssigneeSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full text-xs pl-7 pr-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#1A3A5C]/30 focus:border-[#1A3A5C]/40 bg-gray-50"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filteredMembers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Aucun membre trouvé</p>
              ) : (
                filteredMembers.map(m => {
                  const sel = localAssigneeIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={e => { e.stopPropagation(); toggleAssignee(m.id); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors ${sel ? 'bg-[#1A3A5C]/5' : 'hover:bg-gray-50'}`}
                    >
                      <MemberAvatar member={m} size="sm" />
                      <span className="flex-1 text-left text-xs font-medium text-gray-800 truncate">{m.full_name}</span>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${sel ? 'bg-[#1A3A5C] border-[#1A3A5C]' : 'border-gray-300'}`}>
                        {sel && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="border-t border-gray-100 p-2.5 flex gap-2">
              <button
                onClick={e => { e.stopPropagation(); setShowAssigneePicker(false); }}
                className="flex-1 text-xs text-gray-500 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleApplyAssignees}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white py-1.5 rounded-lg bg-[#1A3A5C] hover:bg-[#142d47] transition-colors font-medium"
              >
                <Check className="w-3 h-3" />
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
