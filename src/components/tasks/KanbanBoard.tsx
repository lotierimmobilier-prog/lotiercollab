import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Pencil, Check, X, Trash2, SquareCheck as CheckSquare, Users } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskStatus, Member, KanbanColumn } from '../../types';
import { TaskCard } from './TaskCard';
import { BulkAssignModal } from './BulkAssignModal';
import { setTaskAssignees } from '../../hooks/useStore';

interface ColumnBulkBarProps {
  selectedCount: number;
  members: Member[];
  tasks: Task[];
  selectedIds: Set<string>;
  onRefresh?: () => void;
  onCancel: () => void;
  onDeleteTask?: (taskId: string) => void;
}

function ColumnBulkBar({
  selectedCount,
  members,
  tasks,
  selectedIds,
  onRefresh,
  onCancel,
  onDeleteTask,
}: ColumnBulkBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleApply = async (ids: string[], mode: 'replace' | 'add') => {
    const taskList = tasks.filter(t => selectedIds.has(t.id));
    for (const task of taskList) {
      if (mode === 'replace') {
        await setTaskAssignees(task.id, ids, task.title);
      } else {
        const existing = (task.assignees ?? []).map(m => m.id);
        const merged = Array.from(new Set([...existing, ...ids]));
        await setTaskAssignees(task.id, merged, task.title);
      }
    }
    onRefresh?.();
    onCancel();
  };

  const handleDeleteSelected = async () => {
    if (!onDeleteTask) return;
    for (const id of Array.from(selectedIds)) await onDeleteTask(id);
    onRefresh?.();
    onCancel();
  };

  return (
    <>
      <div className="mx-1 mb-2 bg-white border border-[#1A3A5C]/20 rounded-xl shadow-md animate-in slide-in-from-top-2 duration-150">
        <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
          <div className="w-5 h-5 rounded-md bg-[#1A3A5C] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">{selectedCount}</span>
          </div>
          <span className="text-xs font-semibold text-gray-700 flex-1 whitespace-nowrap">
            tâche{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3A5C] text-white text-xs font-semibold rounded-lg hover:bg-[#142d47] transition-colors shadow-sm"
          >
            <Users className="w-3 h-3" />
            Assigner
          </button>
          {onDeleteTask && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Supprimer
            </button>
          )}
          {onDeleteTask && confirmDelete && (
            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
              <span className="text-[10px] text-red-600 font-medium whitespace-nowrap">Confirmer ?</span>
              <button
                onClick={handleDeleteSelected}
                className="text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 px-1.5 py-0.5 rounded transition-colors"
              >
                Oui
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] font-medium text-red-400 hover:text-red-600 px-1 py-0.5 rounded transition-colors"
              >
                Non
              </button>
            </div>
          )}
          <button onClick={onCancel} className="text-gray-300 hover:text-gray-500 transition-colors ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {modalOpen && (
        <BulkAssignModal
          selectedCount={selectedCount}
          members={members}
          onApply={handleApply}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

interface SortableTaskProps {
  task: Task;
  onClick: () => void;
  onDelete?: (taskId: string) => void;
  onToggleUrgent?: (taskId: string) => void;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  members?: Member[];
  onChangeAssignees?: (taskId: string, memberIds: string[]) => void;
}

function SortableTask({ task, onClick, onDelete, onToggleUrgent, selectionMode, isSelected, onToggleSelect, members, onChangeAssignees }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: selectionMode && !isSelected,
  });
  const dragStarted = useRef(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const handleCardClick = useCallback(() => {
    if (dragStarted.current) return;
    if (selectionMode) {
      onToggleSelect(task.id);
    } else {
      onClick();
    }
  }, [selectionMode, onToggleSelect, onClick, task.id]);

  useEffect(() => {
    if (isDragging) dragStarted.current = true;
  }, [isDragging]);

  const canDrag = !selectionMode || isSelected;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStarted.current = false;
    if (canDrag) {
      listeners?.onPointerDown?.(e);
    }
  }, [canDrag, listeners]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative"
      onPointerDown={handlePointerDown}
    >
      {selectionMode && (
        <div
          className="absolute top-2 left-2 z-20"
          onClick={e => { e.stopPropagation(); onToggleSelect(task.id); }}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shadow-sm ${
            isSelected ? 'bg-[#1A3A5C] border-[#1A3A5C]' : 'bg-white border-gray-300 hover:border-[#1A3A5C]/60'
          }`}>
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      )}
      <div
        onClick={handleCardClick}
        className={selectionMode ? (isSelected ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer') : ''}
      >
        <TaskCard
          task={task}
          onClick={handleCardClick}
          onDelete={selectionMode ? undefined : onDelete}
          onToggleUrgent={selectionMode ? undefined : onToggleUrgent}
          isDragging={isDragging}
          members={selectionMode ? undefined : members}
          onChangeAssignees={selectionMode ? undefined : onChangeAssignees}
        />
      </div>
      {selectionMode && isSelected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-[#1A3A5C]/40 bg-[#1A3A5C]/[0.04] pointer-events-none" />
      )}
    </div>
  );
}

interface ColumnHeaderProps {
  column: KanbanColumn;
  count: number;
  canEdit: boolean;
  onRename: (id: string, newLabel: string) => void;
  onDelete: (id: string) => void;
  selectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectAll: () => void;
}

function ColumnHeader({ column, count, canEdit, onRename, onDelete, selectionMode, selectedCount, totalCount, onToggleSelectAll }: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(column.label);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(column.label);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, column.label]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== column.label) onRename(column.id, trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(column.label);
    setEditing(false);
  };

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-2 mb-3 px-1 bg-red-50 rounded-lg py-1.5">
        <span className="text-xs text-red-600 flex-1">Supprimer "{column.label}" ?</span>
        <button
          onClick={() => onDelete(column.id)}
          className="text-xs font-medium text-red-600 hover:text-red-800 px-1.5 py-0.5 rounded bg-red-100 hover:bg-red-200 transition-colors"
        >
          Oui
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="text-xs text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Non
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-3 px-1 group/header">
      {selectionMode && totalCount > 0 && (
        <div
          onClick={onToggleSelectAll}
          className="flex-shrink-0 cursor-pointer"
          title={selectedCount === totalCount ? 'Tout désélectionner' : 'Tout sélectionner'}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
            selectedCount === totalCount && totalCount > 0
              ? 'bg-[#1A3A5C] border-[#1A3A5C]'
              : selectedCount > 0
              ? 'border-[#1A3A5C] bg-[#1A3A5C]/20'
              : 'border-gray-300 hover:border-[#1A3A5C]/60'
          }`}>
            {selectedCount > 0 && selectedCount < totalCount && (
              <div className="w-2 h-0.5 bg-[#1A3A5C] rounded-full" />
            )}
            {selectedCount === totalCount && totalCount > 0 && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
        </div>
      )}

      {!selectionMode && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${column.dot_color}`} />}
      {selectionMode && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${column.dot_color}`} />}

      {editing ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') cancel();
            }}
            className="flex-1 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md px-1.5 py-0.5 outline-none focus:border-[#1A3A5C] min-w-0"
            autoFocus
          />
          <button onClick={commit} className="text-green-500 hover:text-green-700 flex-shrink-0">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={cancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <h3
            className={`text-sm font-semibold text-gray-700 truncate transition-colors ${canEdit && !selectionMode ? 'cursor-pointer hover:text-[#1A3A5C]' : ''}`}
            onDoubleClick={canEdit && !selectionMode ? () => setEditing(true) : undefined}
            title={canEdit && !selectionMode ? 'Double-cliquer pour renommer' : undefined}
          >
            {column.label}
          </h3>
          {canEdit && !selectionMode && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover/header:opacity-100 text-gray-300 hover:text-gray-500 transition-all flex-shrink-0"
                title="Renommer"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="opacity-0 group-hover/header:opacity-100 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                title="Supprimer la colonne"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      )}

      <span className="ml-auto text-xs text-gray-400 bg-gray-200 rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
        {count}
      </span>
    </div>
  );
}

interface KanbanColumnViewProps {
  column: KanbanColumn;
  tasks: Task[];
  members: Member[];
  onTaskClick: (taskId: string) => void;
  onAddTask?: (status: TaskStatus) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleUrgent?: (taskId: string) => void;
  onRename: (id: string, newLabel: string) => void;
  onDeleteColumn: (id: string) => void;
  canEdit: boolean;
  isOver: boolean;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (columnId: string, taskIds: string[]) => void;
  onRefresh?: () => void;
  onCancelColumnSelection: (columnId: string) => void;
  onChangeAssignees?: (taskId: string, memberIds: string[]) => void;
}

function KanbanColumnView({
  column, tasks, members, onTaskClick, onAddTask, onDeleteTask, onToggleUrgent,
  onRename, onDeleteColumn, canEdit, isOver, selectionMode, selectedIds,
  onToggleSelect, onToggleSelectAll, onRefresh,
  onCancelColumnSelection, onChangeAssignees,
}: KanbanColumnViewProps) {
  const { setNodeRef } = useDroppable({ id: column.id });

  const columnTaskIds = tasks.map(t => t.id);
  const selectedInColumn = new Set(columnTaskIds.filter(id => selectedIds.has(id)));
  const hasSelection = selectedInColumn.size > 0;

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <ColumnHeader
        column={column}
        count={tasks.length}
        canEdit={canEdit}
        onRename={onRename}
        onDelete={onDeleteColumn}
        selectionMode={selectionMode}
        selectedCount={selectedInColumn.size}
        totalCount={tasks.length}
        onToggleSelectAll={() => onToggleSelectAll(column.id, columnTaskIds)}
      />

      {selectionMode && hasSelection && (
        <div onPointerDown={e => e.stopPropagation()}>
          <ColumnBulkBar
            selectedCount={selectedInColumn.size}
            members={members}
            tasks={tasks}
            selectedIds={selectedInColumn}
            onRefresh={onRefresh}
            onCancel={() => onCancelColumnSelection(column.id)}
            onDeleteTask={onDeleteTask}
          />
        </div>
      )}

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 min-h-[200px] transition-colors duration-150 ${
          isOver ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-100/70'
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">Aucune tâche</div>
            ) : (
              tasks.map(task => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task.id)}
                  onDelete={onDeleteTask}
                  onToggleUrgent={onToggleUrgent}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(task.id)}
                  onToggleSelect={onToggleSelect}
                  members={members}
                  onChangeAssignees={onChangeAssignees}
                />
              ))
            )}
          </div>
        </SortableContext>

        {onAddTask && !selectionMode && (
          <button
            onClick={() => onAddTask(column.id)}
            className="w-full mt-2 flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        )}
      </div>
    </div>
  );
}

interface AddColumnButtonProps {
  onAdd: (label: string) => void;
}

function AddColumnButton({ onAdd }: AddColumnButtonProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setLabel('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSubmit = () => {
    const trimmed = label.trim();
    if (trimmed) {
      onAdd(trimmed);
      setLabel('');
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex flex-col w-72 flex-shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-all duration-150 min-h-[120px] py-6 px-4"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-medium">Ajouter une colonne</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col w-72 flex-shrink-0 rounded-xl border-2 border-dashed border-[#1A3A5C]/30 bg-blue-50/30 p-3 gap-2">
      <input
        ref={inputRef}
        value={label}
        onChange={e => setLabel(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Nom de la colonne..."
        className="w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-md px-2.5 py-1.5 outline-none focus:border-[#1A3A5C] placeholder:text-gray-400"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!label.trim()}
          className="flex-1 flex items-center justify-center gap-1 bg-[#1A3A5C] text-white text-xs font-medium py-1.5 rounded-lg hover:bg-[#15304e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          Créer
        </button>
        <button
          onClick={() => setOpen(false)}
          className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-600 text-xs font-medium py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Annuler
        </button>
      </div>
    </div>
  );
}

interface Props {
  columns: KanbanColumn[];
  tasks: Task[];
  members?: Member[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddTask?: (status: TaskStatus) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleUrgent?: (taskId: string) => void;
  onRenameColumn: (id: string, label: string) => void;
  onAddColumn: (label: string) => void;
  onDeleteColumn: (id: string) => void;
  canEdit?: boolean;
  canBulkAssign?: boolean; // kept for API compatibility, selection always shows assignees
  onBulkUpdate?: (ids: string[], updates: Partial<Task>) => Promise<void>;
  onRefresh?: () => void;
  onChangeAssignees?: (taskId: string, memberIds: string[]) => void;
}

function buildCollisionDetection(columnIds: string[]): CollisionDetection {
  return (args) => {
    const columnCollisions = rectIntersection({
      ...args,
      droppableContainers: args.droppableContainers.filter(c => columnIds.includes(String(c.id))),
    });
    if (columnCollisions.length > 0) return columnCollisions;
    return rectIntersection(args);
  };
}

export function KanbanBoard({
  columns,
  tasks,
  members = [],
  onTaskClick,
  onStatusChange,
  onAddTask,
  onDeleteTask,
  onToggleUrgent,
  onRenameColumn,
  onAddColumn,
  onDeleteColumn,
  canEdit = false,
  onBulkUpdate,
  onRefresh,
  onChangeAssignees,
}: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const columnIds = columns.map(c => c.id);
  const collisionDetection = buildCollisionDetection(columnIds);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (!task) return;
    if (selectionMode && !selectedIds.has(task.id)) return;
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) { setOverColumnId(null); return; }
    const overId = String(over.id);
    if (columnIds.includes(overId)) { setOverColumnId(overId); return; }
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) setOverColumnId(overTask.status);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumnId(null);
    if (!over) return;
    const draggedTask = tasks.find(t => t.id === active.id);
    if (!draggedTask) return;

    const overId = String(over.id);
    const isColumn = columnIds.includes(overId);
    let targetStatus: string | undefined;
    if (isColumn) {
      targetStatus = overId;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      targetStatus = overTask?.status ?? overColumnId ?? undefined;
    }
    if (!targetStatus) return;

    if (selectionMode && selectedIds.has(draggedTask.id)) {
      const idsToMove = [...selectedIds].filter(id => {
        const t = tasks.find(x => x.id === id);
        return t && t.status !== targetStatus;
      });
      if (idsToMove.length > 0 && onBulkUpdate) {
        onBulkUpdate(idsToMove, { status: targetStatus as TaskStatus }).then(() => {
          onRefresh?.();
          setSelectedIds(new Set());
        });
      }
    } else if (!selectionMode && targetStatus !== draggedTask.status) {
      onStatusChange(String(active.id), targetStatus as TaskStatus);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (_columnId: string, taskIds: string[]) => {
    const allSelected = taskIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        taskIds.forEach(id => next.delete(id));
      } else {
        taskIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const cancelColumnSelection = (columnId: string) => {
    const colTaskIds = tasks.filter(t => t.status === columnId).map(t => t.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      colTaskIds.forEach(id => next.delete(id));
      return next;
    });
  };

  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const totalSelected = selectedIds.size;

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-3">
        {!selectionMode ? (
          <button
            onClick={enterSelectionMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Sélection multiple
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#1A3A5C] font-medium bg-[#1A3A5C]/5 border border-[#1A3A5C]/20 rounded-lg px-3 py-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              Mode sélection — {totalSelected} tâche{totalSelected !== 1 ? 's' : ''} sélectionnée{totalSelected !== 1 ? 's' : ''}
            </div>
            <button
              onClick={exitSelectionMode}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <X className="w-3 h-3" />
              Terminer
            </button>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 flex-1 pb-4 overflow-x-auto">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <KanbanColumnView
                key={col.id}
                column={col}
                tasks={colTasks}
                members={members}
                onTaskClick={onTaskClick}
                onAddTask={onAddTask}
                onDeleteTask={onDeleteTask}
                onToggleUrgent={onToggleUrgent}
                onRename={onRenameColumn}
                onDeleteColumn={onDeleteColumn}
                canEdit={canEdit}
                isOver={overColumnId === col.id}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onRefresh={onRefresh}
                onCancelColumnSelection={cancelColumnSelection}
                onChangeAssignees={onChangeAssignees}
              />
            );
          })}

          {canEdit && !selectionMode && <AddColumnButton onAdd={onAddColumn} />}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="relative">
              <TaskCard task={activeTask} onClick={() => {}} isDragging />
              {selectionMode && selectedIds.size > 1 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1A3A5C] text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-2 ring-white z-10">
                  {selectedIds.size}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
