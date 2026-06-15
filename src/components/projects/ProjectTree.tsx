import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronRight, ChevronDown, Plus, GripVertical,
  CircleCheck, Circle, Ban, ArrowRight,
  Trash2, RefreshCw, X, Lock,
} from 'lucide-react';
import type { Project, Task, TaskStatus, TaskRecurrence } from '../../types';
import { RECURRENCE_OPTIONS } from '../../lib/dateUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ProjectRowProps {
  project: Project;
  children: Project[];
  allProjects: Project[];
  tasks: Task[];
  depth: number;
  isLast: boolean;
  onAddSubProject?: (parentId: string, parentName: string) => void;
  onDelete?: (id: string) => void;
  onUpdateRecurrence: (id: string, recurrence: TaskRecurrence | null) => void;
  onMove: (projectId: string, newParentId: string | null, newIndex: number) => void;
  isDraggingId: string | null;
}

function ProjectRow({
  project,
  children,
  allProjects,
  tasks,
  depth,
  isLast,
  onAddSubProject,
  onDelete,
  onUpdateRecurrence,
  onMove,
  isDraggingId,
}: ProjectRowProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const hasChildren = children.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, data: { project, depth } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const done = projectTasks.filter(t => t.status === 'done').length;
  const doing = projectTasks.filter(t => t.status === 'doing').length;
  const blocked = projectTasks.filter(t => t.status === 'blocked').length;
  const todo = projectTasks.filter(t => t.status === 'todo').length;

  const statusPills: { status: TaskStatus; count: number; label: string; cls: string }[] = [
    { status: 'todo', count: todo, label: 'À faire', cls: 'bg-gray-100 text-gray-500' },
    { status: 'doing', count: doing, label: 'En cours', cls: 'bg-blue-50 text-blue-600' },
    { status: 'done', count: done, label: 'Terminé', cls: 'bg-green-50 text-green-600' },
    { status: 'blocked', count: blocked, label: 'Bloqué', cls: 'bg-red-50 text-red-500' },
  ];

  const recurrenceLabel = project.default_recurrence
    ? RECURRENCE_OPTIONS.find(o => o.value === project.default_recurrence)?.label
    : null;

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-stretch">
        {depth > 0 && (
          <div className="flex-shrink-0" style={{ width: `${depth * 28}px` }}>
            <div className="flex h-full">
              {Array.from({ length: depth - 1 }).map((_, i) => (
                <div key={i} className="w-7 flex justify-center">
                  <div className="w-px bg-gray-200 h-full" />
                </div>
              ))}
              <div className="w-7 flex flex-col items-center">
                <div className="w-px bg-gray-200 flex-1" style={{ minHeight: '20px' }} />
                <div className="w-3 h-px bg-gray-200" style={{ marginTop: '-1px' }} />
                {!isLast && <div className="w-px bg-gray-200 flex-1" />}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all group">
            <div className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  {...listeners}
                  {...attributes}
                  className="cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 transition-colors flex-shrink-0 touch-none opacity-0 group-hover:opacity-100"
                  onClick={e => e.stopPropagation()}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                  className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${hasChildren ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-200 cursor-default'}`}
                  disabled={!hasChildren}
                >
                  {hasChildren
                    ? expanded
                      ? <ChevronDown className="w-3.5 h-3.5" />
                      : <ChevronRight className="w-3.5 h-3.5" />
                    : <ArrowRight className="w-3 h-3 opacity-0" />
                  }
                </button>

                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />

                <button
                  className="flex-1 text-left text-sm font-semibold text-gray-800 hover:text-[#1A3A5C] transition-colors truncate"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {project.name}
                </button>

                {project.is_private && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 flex-shrink-0">
                    <Lock className="w-2.5 h-2.5" />
                    Privé
                  </span>
                )}

                <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                  {statusPills.filter(p => p.count > 0).map(({ status, count, label, cls }) => (
                    <span key={status} className={`hidden sm:inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${cls}`}>
                      {status === 'done' && <CircleCheck className="w-2.5 h-2.5" />}
                      {status === 'todo' && <Circle className="w-2.5 h-2.5" />}
                      {status === 'blocked' && <Ban className="w-2.5 h-2.5" />}
                      {count}
                      <span className="hidden md:inline">{label}</span>
                    </span>
                  ))}

                  {projectTasks.length > 0 && (
                    <span className="text-xs text-gray-400 font-medium tabular-nums">{projectTasks.length}</span>
                  )}

                  {recurrenceLabel && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                      <RefreshCw className="w-2.5 h-2.5" />
                      {recurrenceLabel}
                    </span>
                  )}

                  <button
                    onClick={e => { e.stopPropagation(); setShowRecurrence(v => !v); setConfirmDelete(false); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-md p-0.5 transition-all flex-shrink-0"
                    title="Récurrence par défaut"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  {onAddSubProject && (
                  <button
                    onClick={e => { e.stopPropagation(); onAddSubProject(project.id, project.name); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-[#1A3A5C] hover:bg-gray-50 rounded-md p-0.5 transition-all flex-shrink-0"
                    title="Ajouter un sous-projet"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  )}

                  {onDelete && confirmDelete ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <span className="text-xs text-red-500 whitespace-nowrap">Supprimer ?</span>
                      <button
                        onClick={() => { onDelete(project.id); setConfirmDelete(false); }}
                        className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Non
                      </button>
                    </div>
                  ) : onDelete ? (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(true); setShowRecurrence(false); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md p-0.5 transition-all flex-shrink-0"
                      title="Supprimer le projet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              {showRecurrence && (
                <div className="mt-2.5 ml-7 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 max-w-xs">
                    <Select
                      value={project.default_recurrence ?? '__none__'}
                      onValueChange={v => {
                        onUpdateRecurrence(project.id, v === '__none__' ? null : v as TaskRecurrence);
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Aucune récurrence par défaut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune récurrence par défaut</SelectItem>
                        {RECURRENCE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    onClick={() => setShowRecurrence(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {project.default_recurrence && (
                    <span className="text-xs text-gray-400">Appliqué par défaut aux nouvelles tâches</span>
                  )}
                </div>
              )}

              {projectTasks.length > 0 && (
                <div className="mt-2.5 ml-7 h-1 bg-gray-100 rounded-full overflow-hidden flex">
                  {done > 0 && <div className="bg-green-400 h-full transition-all" style={{ width: `${(done / projectTasks.length) * 100}%` }} />}
                  {doing > 0 && <div className="bg-blue-400 h-full transition-all" style={{ width: `${(doing / projectTasks.length) * 100}%` }} />}
                  {blocked > 0 && <div className="bg-red-400 h-full transition-all" style={{ width: `${(blocked / projectTasks.length) * 100}%` }} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-1.5 ml-7">
          <SortableProjectList
            projects={children}
            allProjects={allProjects}
            tasks={tasks}
            depth={depth + 1}
            onAddSubProject={onAddSubProject}
            onDelete={onDelete}
            onUpdateRecurrence={onUpdateRecurrence}
            onMove={onMove}
            isDraggingId={isDraggingId}
          />
        </div>
      )}
    </div>
  );
}

interface SortableProjectListProps {
  projects: Project[];
  allProjects: Project[];
  tasks: Task[];
  depth: number;
  onAddSubProject?: (parentId: string, parentName: string) => void;
  onDelete?: (id: string) => void;
  onUpdateRecurrence: (id: string, recurrence: TaskRecurrence | null) => void;
  onMove: (projectId: string, newParentId: string | null, newIndex: number) => void;
  isDraggingId: string | null;
}

function SortableProjectList({
  projects,
  allProjects,
  tasks,
  depth,
  onAddSubProject,
  onDelete,
  onUpdateRecurrence,
  onMove,
  isDraggingId,
}: SortableProjectListProps) {
  const sorted = [...projects].sort((a, b) => a.sort_order - b.sort_order);
  return (
    <SortableContext items={sorted.map(p => p.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-1.5">
        {sorted.map((project, i) => (
          <ProjectRow
            key={project.id}
            project={project}
            children={allProjects.filter(p => p.parent_id === project.id).sort((a, b) => a.sort_order - b.sort_order)}
            allProjects={allProjects}
            tasks={tasks}
            depth={depth}
            isLast={i === sorted.length - 1}
            onAddSubProject={onAddSubProject}
            onDelete={onDelete}
            onUpdateRecurrence={onUpdateRecurrence}
            onMove={onMove}
            isDraggingId={isDraggingId}
          />
        ))}
      </div>
    </SortableContext>
  );
}

interface ProjectTreeProps {
  projects: Project[];
  tasks: Task[];
  onAddSubProject?: (parentId: string, parentName: string) => void;
  onMove: (projectId: string, newParentId: string | null, newIndex: number) => void;
  onDelete?: (id: string) => void;
  onUpdateRecurrence: (id: string, recurrence: TaskRecurrence | null) => void;
}

export function ProjectTree({ projects, tasks, onAddSubProject, onMove, onDelete, onUpdateRecurrence }: ProjectTreeProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const rootProjects = projects.filter(p => !p.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const draggingProject = draggingId ? projects.find(p => p.id === draggingId) : null;

  function getParentId(id: string): string | null {
    return projects.find(p => p.id === id)?.parent_id ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id));
  }

  function handleDragOver(_event: DragOverEvent) {}

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overItemId = String(over.id);

    const overParent = getParentId(overItemId);
    const targetParent = overParent;

    const siblings = projects
      .filter(p => p.parent_id === targetParent && p.id !== activeId)
      .sort((a, b) => a.sort_order - b.sort_order);

    const overIndex = siblings.findIndex(p => p.id === overItemId);
    const insertIndex = overIndex >= 0 ? overIndex : siblings.length;

    onMove(activeId, targetParent, insertIndex);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={rootProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {rootProjects.map((project, i) => (
            <ProjectRow
              key={project.id}
              project={project}
              children={projects.filter(p => p.parent_id === project.id).sort((a, b) => a.sort_order - b.sort_order)}
              allProjects={projects}
              tasks={tasks}
              depth={0}
              isLast={i === rootProjects.length - 1}
              onAddSubProject={onAddSubProject}
              onDelete={onDelete}
              onUpdateRecurrence={onUpdateRecurrence}
              onMove={onMove}
              isDraggingId={draggingId}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {draggingProject && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3 opacity-95 w-72">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: draggingProject.color }} />
              <span className="text-sm font-semibold text-gray-900 truncate">{draggingProject.name}</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
