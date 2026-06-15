import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LayoutGrid, List, Plus, Upload } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskListView } from '../components/tasks/TaskListView';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { NewTaskModal } from '../components/tasks/NewTaskModal';
import { NewProjectModal } from '../components/projects/NewProjectModal';
import { ProjectTree } from '../components/projects/ProjectTree';
import { BulkImportModal } from '../components/tasks/BulkImportModal';
import { useKanbanColumns } from '../hooks/useStore';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import type { TaskStatus, TaskRecurrence } from '../types';
import { computeNextRecurrenceDate } from '../lib/dateUtils';

const DONE_STATUSES = ['done', 'terminé', 'termine', 'closed', 'fermé', 'ferme', 'completed'];

export function Projects() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, createProject, moveProject, updateProject, deleteProject, tasks: allTasksRaw, updateTask, createTask, deleteTask, members } = useAppData();
  const { columns, addColumn, updateColumn, deleteColumn } = useKanbanColumns();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newProjectParentId, setNewProjectParentId] = useState<string | null>(null);
  const [newProjectParentName, setNewProjectParentName] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filter tasks client-side — no extra DB round-trip
  const tasks = projectId ? allTasksRaw.filter(t => t.project_id === projectId) : allTasksRaw;
  const { memberId: authMemberId, isSuperAdmin, session } = useAuth();
  const currentMember = authMemberId ? members.find(m => m.id === authMemberId) : members[0];

  const openNewProject = (parentId: string | null = null, parentName?: string) => {
    setNewProjectParentId(parentId);
    setNewProjectParentName(parentName);
    setShowNewProject(true);
  };

  // If creating a sub-project under a private project, inherit privacy + owner
  const parentProject = newProjectParentId ? projects.find(p => p.id === newProjectParentId) : null;
  const parentIsPrivate = parentProject?.is_private ?? false;

  const handleStatusChange = (id: string, status: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (task?.recurrence && DONE_STATUSES.some(ds => (status as string).toLowerCase().includes(ds))) {
      const nextDate = computeNextRecurrenceDate(new Date(), task.recurrence as TaskRecurrence);
      updateTask(id, { status: 'todo' as TaskStatus, due_date: nextDate, next_recurrence_date: nextDate });
    } else {
      updateTask(id, { status });
    }
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    if (projectId && (id === projectId || projects.find(p => p.id === projectId)?.parent_id === id)) {
      navigate('/projects');
    }
  };

  const handleUpdateProjectRecurrence = (id: string, recurrence: TaskRecurrence | null) => {
    updateProject(id, { default_recurrence: recurrence });
  };

  const handleBulkImport = async (rows: Array<{
    title: string; description: string; priority: Parameters<typeof createTask>[0]['priority'];
    status: string; due_date: string | null; assigned_to: string | null;
    recurrence: TaskRecurrence | null; project_id?: string | null;
  }>) => {
    for (const row of rows) {
      await createTask({ ...row, status: row.status as string });
    }
  };

  const handleCreateTask = async (data: Parameters<typeof createTask>[0]) => {
    const project = projectId ? projects.find(p => p.id === projectId) : null;
    const defaultRecurrence = project?.default_recurrence ?? null;
    return createTask({
      ...data,
      project_id: projectId ?? data.project_id,
      recurrence: data.recurrence ?? defaultRecurrence,
    });
  };

  if (projectId) {
    const project = projects.find(p => p.id === projectId);

    return (
      <AppLayout>
        <Topbar
          title={project?.name ?? 'Projet'}
          onNewTask={() => setShowNewTask(true)}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Importer
              </button>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-[#1A3A5C] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-[#1A3A5C] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          }
        />
        <main className="flex-1 p-6 overflow-hidden">
          {viewMode === 'kanban' ? (
            <div className="h-full overflow-auto">
              <KanbanBoard
                columns={columns}
                tasks={tasks}
                onTaskClick={setSelectedTaskId}
                onStatusChange={handleStatusChange}
                onAddTask={() => setShowNewTask(true)}
                onDeleteTask={isSuperAdmin ? deleteTask : undefined}
                onToggleUrgent={(taskId) => {
                  const task = tasks.find(t => t.id === taskId);
                  if (!task) return;
                  updateTask(taskId, { priority: task.priority === 'urgent' ? 'normal' : 'urgent' });
                }}
                onRenameColumn={(id, label) => updateColumn(id, { label })}
                onAddColumn={addColumn}
                onDeleteColumn={deleteColumn}
                canEdit={isSuperAdmin}
              />
            </div>
          ) : (
            <div className="overflow-auto h-full">
              <TaskListView tasks={tasks} onTaskClick={setSelectedTaskId} onDeleteTask={isSuperAdmin ? deleteTask : undefined} />
            </div>
          )}
        </main>

        {selectedTaskId && (
          <TaskDetailPanel
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
            projects={projects}
            members={members}
            currentMemberId={currentMember?.id}
            onDeleteTask={isSuperAdmin ? (id) => { deleteTask(id); setSelectedTaskId(null); } : undefined}
            kanbanColumns={columns}
          />
        )}

        <NewTaskModal
          open={showNewTask}
          onClose={() => setShowNewTask(false)}
          onSubmit={handleCreateTask}
          projects={projects}
          members={members}
          defaultProjectId={projectId}
          defaultRecurrence={project?.default_recurrence ?? null}
        />

        <BulkImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
          onImport={handleBulkImport}
          projects={projects}
          members={members}
          defaultProjectId={projectId}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Topbar
        title="Projets"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Importer des tâches
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => openNewProject(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3A5C] hover:bg-[#142d47] text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouveau projet
              </button>
            )}
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          {projects.filter(p => !p.parent_id).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <p className="text-sm font-medium mb-2">Aucun projet disponible</p>
            </div>
          ) : (
            <ProjectTree
              projects={projects}
              tasks={allTasksRaw}
              onAddSubProject={isSuperAdmin ? (parentId, parentName) => openNewProject(parentId, parentName) : undefined}
              onMove={(projectId, newParentId, newIndex) => moveProject(projectId, newParentId, newIndex)}
              onDelete={isSuperAdmin ? handleDeleteProject : undefined}
              onUpdateRecurrence={handleUpdateProjectRecurrence}
            />
          )}
        </div>
      </main>

      <NewProjectModal
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        parentId={newProjectParentId}
        parentName={newProjectParentName}
        isSuperAdmin={isSuperAdmin}
        forcePrivate={parentIsPrivate}
        onSubmit={data => {
          const isPrivate = data.is_private ?? false;
          return createProject({
            ...data,
            is_private: isPrivate,
            owner_auth_user_id: isPrivate ? (parentProject?.owner_auth_user_id ?? session?.user.id ?? null) : null,
          });
        }}
      />

      <BulkImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleBulkImport}
        projects={projects}
        members={members}
        defaultProjectId={null}
      />
    </AppLayout>
  );
}
