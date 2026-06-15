import { useState, useRef, useCallback, useEffect } from 'react';
import { MessageSquare, Calendar, Trash2, Check, Users, X, AlertTriangle } from 'lucide-react';
import type { Task, Member, Project } from '../../types';
import { MemberAvatar } from '../common/MemberAvatar';
import { ProjectBadge } from '../common/ProjectBadge';
import { StatusBadge } from '../common/StatusBadge';
import { BulkAssignModal } from './BulkAssignModal';
import { formatRelativeDate } from '../../lib/dateUtils';
import { priorityConfig } from '../../lib/priorityUtils';
import { setTaskAssignees } from '../../hooks/useStore';

interface AssigneeChipsProps {
  assignees: Member[];
}

function AssigneeChips({ assignees }: AssigneeChipsProps) {
  const MAX = 4;
  const visible = assignees.slice(0, MAX);
  const overflow = assignees.length - MAX;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center" style={{ gap: 0 }}>
        {visible.map((m, i) => (
          <div
            key={m.id}
            className="ring-2 ring-white rounded-full flex-shrink-0"
            style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: visible.length - i }}
            title={m.full_name}
          >
            <MemberAvatar member={m} size="sm" />
          </div>
        ))}
        {overflow > 0 && (
          <div
            className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center flex-shrink-0 text-[9px] font-semibold text-gray-500"
            style={{ marginLeft: '-8px', zIndex: 0 }}
          >
            +{overflow}
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        {assignees.length === 1 ? (
          <span className="text-xs text-gray-700 leading-none truncate max-w-[80px]">{assignees[0].full_name.split(' ')[0]}</span>
        ) : (
          <span className="text-xs text-gray-500 leading-none">{assignees.length} responsables</span>
        )}
      </div>
    </div>
  );
}

function DeleteCell({ onDelete }: { onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => { onDelete(); setConfirm(false); }}
          className="text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 px-1.5 py-0.5 rounded transition-colors"
        >
          Oui
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-[10px] font-medium text-gray-400 hover:text-gray-600 px-1 py-0.5 rounded transition-colors"
        >
          Non
        </button>
      </div>
    );
  }
  return (
    <div onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setConfirm(true)}
        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-all group/del"
        title="Supprimer"
      >
        <Trash2 className="w-3.5 h-3.5 text-gray-300 group-hover/del:text-red-500 transition-colors" />
      </button>
    </div>
  );
}

// Lasso selection rectangle
interface LassoProps {
  rect: { x: number; y: number; w: number; h: number } | null;
}
function LassoRect({ rect }: LassoProps) {
  if (!rect) return null;
  return (
    <div
      className="fixed pointer-events-none z-50 border border-[#1A3A5C] bg-[#1A3A5C]/10 rounded"
      style={{
        left: Math.min(rect.x, rect.x + rect.w),
        top: Math.min(rect.y, rect.y + rect.h),
        width: Math.abs(rect.w),
        height: Math.abs(rect.h),
      }}
    />
  );
}

interface AssignBarProps {
  selectedCount: number;
  members: Member[];
  onApply: (ids: string[], mode: 'replace' | 'add') => Promise<void>;
  onCancel: () => void;
  onDeleteSelected?: () => void;
}
function AssignBar({ selectedCount, members, onApply, onCancel, onDeleteSelected }: AssignBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div className="mb-3 flex items-center gap-3 bg-white border border-[#1A3A5C]/20 rounded-xl px-4 py-2.5 shadow-sm" data-no-lasso="true">
        <div className="w-6 h-6 rounded-lg bg-[#1A3A5C] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[10px] font-bold leading-none">{selectedCount}</span>
        </div>
        <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
          tâche{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
        </span>

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1A3A5C] text-white text-xs font-semibold rounded-lg hover:bg-[#142d47] transition-colors shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            Assigner des responsables
          </button>

          {onDeleteSelected && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
          )}

          {onDeleteSelected && confirmDelete && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                Supprimer {selectedCount} tâche{selectedCount > 1 ? 's' : ''} ?
              </span>
              <button
                onClick={() => { onDeleteSelected(); setConfirmDelete(false); }}
                className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded transition-colors ml-1"
              >
                Oui
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs font-medium text-red-500 hover:text-red-700 px-1 py-0.5 rounded transition-colors"
              >
                Non
              </button>
            </div>
          )}

          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" />
            Annuler
          </button>
        </div>
      </div>

      {modalOpen && (
        <BulkAssignModal
          selectedCount={selectedCount}
          members={members}
          onApply={onApply}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

interface Props {
  tasks: Task[];
  members?: Member[];
  projects?: Project[];
  onTaskClick: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onBulkUpdate?: (ids: string[], updates: Partial<Task>) => Promise<void>;
  canBulkAssign?: boolean;
  onRefresh?: () => void;
}

export function TaskListView({ tasks, members = [], onTaskClick, onDeleteTask, canBulkAssign = false, onRefresh }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Lasso drag state
  const [lasso, setLasso] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const lassoOrigin = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastClickIndex = useRef<number>(-1);

  const toggleSelect = (id: string, e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    // Shift+click: select range
    if (e.shiftKey && lastClickIndex.current >= 0) {
      const start = Math.min(lastClickIndex.current, index);
      const end = Math.max(lastClickIndex.current, index);
      setSelectedIds(prev => {
        const next = new Set(prev);
        for (let i = start; i <= end; i++) next.add(tasks[i].id);
        return next;
      });
      return;
    }
    lastClickIndex.current = index;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(prev =>
      prev.size === tasks.length ? new Set() : new Set(tasks.map(t => t.id))
    );
  };

  const cancelSelection = () => setSelectedIds(new Set());

  const handleDeleteSelected = onDeleteTask ? async () => {
    for (const id of Array.from(selectedIds)) await onDeleteTask(id);
    cancelSelection();
  } : undefined;

  const handleApply = async (pickedIds: string[], mode: 'replace' | 'add') => {
    const taskList = tasks.filter(t => selectedIds.has(t.id));
    for (const task of taskList) {
      if (mode === 'replace') {
        await setTaskAssignees(task.id, pickedIds, task.title);
      } else {
        const existing = (task.assignees ?? []).map(m => m.id);
        const merged = Array.from(new Set([...existing, ...pickedIds]));
        await setTaskAssignees(task.id, merged, task.title);
      }
    }
    cancelSelection();
    onRefresh?.();
  };

  // Lasso logic
  const getRowsInLasso = useCallback((rect: { x: number; y: number; w: number; h: number }) => {
    const left = Math.min(rect.x, rect.x + rect.w);
    const right = Math.max(rect.x, rect.x + rect.w);
    const top = Math.min(rect.y, rect.y + rect.h);
    const bottom = Math.max(rect.y, rect.y + rect.h);
    const ids: string[] = [];
    rowRefs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > top && r.top < bottom && r.right > left && r.left < right) {
        ids.push(id);
      }
    });
    return ids;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[data-no-lasso]')) return;
    if (e.button !== 0) return;
    lassoOrigin.current = { x: e.clientX, y: e.clientY };
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!lassoOrigin.current) return;
      const dx = e.clientX - lassoOrigin.current.x;
      const dy = e.clientY - lassoOrigin.current.y;
      if (!isDragging.current && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      isDragging.current = true;
      setLasso({ x: lassoOrigin.current.x, y: lassoOrigin.current.y, w: dx, h: dy });
    };

    const onMouseUp = (_e: MouseEvent) => {
      if (!lassoOrigin.current) return;
      if (isDragging.current && lasso) {
        const ids = getRowsInLasso(lasso);
        if (ids.length > 0) {
          setSelectedIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
          });
        }
      }
      lassoOrigin.current = null;
      isDragging.current = false;
      setLasso(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [lasso, getRowsInLasso]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-sm font-medium">Aucune tâche trouvée</p>
        <p className="text-xs mt-1">Créez votre première tâche avec le bouton ci-dessus</p>
      </div>
    );
  }

  const hasSelection = selectedIds.size > 0;

  const gridCols = onDeleteTask
    ? 'grid-cols-[20px_1fr_130px_130px_180px_110px_36px_32px]'
    : 'grid-cols-[20px_1fr_130px_130px_180px_110px_36px]';

  return (
    <div className="space-y-0 select-none" onMouseDown={handleMouseDown}>
      <LassoRect rect={lasso} />

      {hasSelection && (canBulkAssign || onDeleteTask) && (
        <AssignBar
          selectedCount={selectedIds.size}
          members={members}
          onApply={handleApply}
          onCancel={cancelSelection}
          onDeleteSelected={handleDeleteSelected}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Hint */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50/80 border-b border-gray-100">
          <span className="text-[10px] text-gray-400">
            {hasSelection
              ? `${selectedIds.size} tâche${selectedIds.size > 1 ? 's' : ''} sélectionnée${selectedIds.size > 1 ? 's' : ''}`
              : 'Glissez pour sélectionner · Shift+clic pour une plage'}
          </span>
          {hasSelection && (
            <button onClick={cancelSelection} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
              Tout désélectionner
            </button>
          )}
        </div>

        {/* Header */}
        <div className={`grid ${gridCols} gap-3 items-center px-4 py-2.5 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider`}>
          <div data-no-lasso="true" onClick={toggleAll} className="flex items-center justify-center cursor-pointer">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
              selectedIds.size === tasks.length && tasks.length > 0
                ? 'bg-[#1A3A5C] border-[#1A3A5C]'
                : selectedIds.size > 0
                ? 'border-[#1A3A5C] bg-[#1A3A5C]/20'
                : 'border-gray-300 hover:border-[#1A3A5C]/60'
            }`}>
              {selectedIds.size > 0 && selectedIds.size < tasks.length && (
                <div className="w-2 h-0.5 bg-[#1A3A5C] rounded-full" />
              )}
              {selectedIds.size === tasks.length && tasks.length > 0 && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
          </div>
          <span>Tâche</span>
          <span>Projet</span>
          <span>Statut</span>
          <span>Responsables</span>
          <span>Échéance</span>
          <span />
          {onDeleteTask && <span />}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
          {tasks.map((task, index) => {
            const { label, status: dateStatus } = formatRelativeDate(task.due_date);
            const prio = priorityConfig[task.priority];
            const isHighPrio = task.priority === 'urgent' || task.priority === 'high';
            const isSelected = selectedIds.has(task.id);
            const displayAssignees = (task.assignees && task.assignees.length > 0)
              ? task.assignees
              : task.assignee ? [task.assignee] : [];

            return (
              <div
                key={task.id}
                ref={el => {
                  if (el) rowRefs.current.set(task.id, el);
                  else rowRefs.current.delete(task.id);
                }}
                onClick={() => { if (!isDragging.current && !isSelected) onTaskClick(task.id); }}
                className={`grid ${gridCols} gap-3 items-center px-4 py-3 cursor-pointer transition-colors border-l-2 group ${
                  isHighPrio && !isSelected ? prio.border : isSelected ? 'border-l-[#1A3A5C]' : 'border-l-transparent'
                } ${isSelected ? 'bg-[#1A3A5C]/[0.04]' : 'hover:bg-gray-50/80'}`}
              >
                <div
                  data-no-lasso="true"
                  onClick={e => toggleSelect(task.id, e, index)}
                  className="flex items-center justify-center cursor-pointer z-10"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#1A3A5C] border-[#1A3A5C]'
                      : 'border-gray-300 group-hover:border-[#1A3A5C]/40'
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                </div>

                <div className="min-w-0" onClick={() => { if (!isDragging.current) onTaskClick(task.id); }}>
                  <p className="text-sm font-medium text-gray-900 truncate leading-tight">{task.title}</p>
                  {task.comment_count !== undefined && task.comment_count > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                      <MessageSquare className="w-3 h-3" />
                      {task.comment_count}
                    </span>
                  )}
                </div>

                <div>
                  {task.project
                    ? <ProjectBadge project={task.project} size="sm" />
                    : <span className="text-xs text-gray-300">—</span>}
                </div>

                <div><StatusBadge status={task.status} /></div>

                <div className="min-w-0">
                  {displayAssignees.length === 0
                    ? <span className="text-xs text-gray-300">—</span>
                    : <AssigneeChips assignees={displayAssignees} />}
                </div>

                <div>
                  {label ? (
                    <span className={`text-xs font-medium ${
                      dateStatus === 'overdue' ? 'text-red-500' :
                      dateStatus === 'soon' || dateStatus === 'today' ? 'text-orange-500' :
                      'text-gray-500'
                    }`}>{label}</span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  {isHighPrio && (
                    <span className={`text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-md ${prio.text} bg-current/10`}>
                      {prio.label.toUpperCase()}
                    </span>
                  )}
                </div>

                {onDeleteTask && (
                  <DeleteCell onDelete={() => onDeleteTask(task.id)} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
