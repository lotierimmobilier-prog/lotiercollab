import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, UserCheck, Upload, Building2, Search, X } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskListView } from '../components/tasks/TaskListView';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { NewTaskModal } from '../components/tasks/NewTaskModal';
import { BulkImportModal } from '../components/tasks/BulkImportModal';
import { BulkCoproTaskModal } from '../components/tasks/BulkCoproTaskModal';
import { useKanbanColumns, setTaskAssignees } from '../hooks/useStore';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import type { TaskStatus, TaskRecurrence } from '../types';
import { computeNextRecurrenceDate } from '../lib/dateUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MemberAvatar } from '../components/common/MemberAvatar';

type ViewMode = 'kanban' | 'list';

export function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCoproBulk, setShowCoproBulk] = useState(false);
  const [filterProject, setFilterProject] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');

  const { isSuperAdmin, memberId: authMemberId, impersonatedMemberId } = useAuth();
  const { tasks, tasksLoading: loading, refetchTasks: refetch, updateTask, createTask, deleteTask, projects, members } = useAppData();
  const { columns, addColumn, updateColumn, deleteColumn } = useKanbanColumns();

  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId) setSelectedTaskId(taskId);
    const isNew = searchParams.get('new');
    if (isNew) setShowNewTask(true);
  }, [searchParams]);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSearchParams({ task: taskId });
  };

  const handleClosePanel = () => {
    setSelectedTaskId(null);
    setSearchParams({});
  };

  const DONE_STATUSES = ['done', 'terminé', 'termine', 'closed', 'fermé', 'ferme', 'completed'];

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.recurrence && DONE_STATUSES.some(s => status.toLowerCase().includes(s))) {
      const nextDate = computeNextRecurrenceDate(new Date(), task.recurrence as TaskRecurrence);
      await updateTask(taskId, { status: 'todo', due_date: nextDate, next_recurrence_date: nextDate });
    } else {
      await updateTask(taskId, { status });
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setNewTaskStatus(status);
    setShowNewTask(true);
  };

  const handleCreateTask = async (data: Parameters<typeof createTask>[0]) => {
    return await createTask({ ...data, status: data.status ?? newTaskStatus });
  };

  const handleBulkImport = async (rows: Array<{
    title: string; description: string; priority: Parameters<typeof createTask>[0]['priority'];
    status: string; due_date: string | null; assigned_to: string | null;
    assignee_ids?: string[]; recurrence: TaskRecurrence | null; project_id?: string | null;
  }>) => {
    for (const row of rows) {
      const { assignee_ids, project_id, ...rest } = row;
      const { data } = await createTask({
        ...rest,
        status: row.status as string,
        project_id: project_id && project_id !== '__none__' ? project_id : null,
      });
      if (data?.id && assignee_ids && assignee_ids.length > 0) {
        await setTaskAssignees(data.id, assignee_ids, data.title);
      }
    }
  };

  const effectiveMemberFilter = isSuperAdmin
    ? (impersonatedMemberId || filterMember)
    : (authMemberId || '');

  const filteredTasks = tasks.filter(t => {
    if (filterProject && t.project_id !== filterProject) return false;
    if (effectiveMemberFilter && t.assigned_to !== effectiveMemberFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const priorityLabels: Record<string, string> = { low: 'faible', normal: 'normale', high: 'haute', urgent: 'urgente' };
      const matches =
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.project?.name ?? '').toLowerCase().includes(q) ||
        (t.assignee?.full_name ?? '').toLowerCase().includes(q) ||
        (t.assignees ?? []).some(a => a.full_name.toLowerCase().includes(q)) ||
        (t.creator?.full_name ?? '').toLowerCase().includes(q) ||
        (priorityLabels[t.priority] ?? t.priority).toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        (t.due_date ?? '').toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const currentMember = authMemberId
    ? members.find(m => m.id === authMemberId)
    : members[0];

  const impersonatedMember = impersonatedMemberId
    ? members.find(m => m.id === impersonatedMemberId)
    : null;

  return (
    <AppLayout>
      <Topbar
        title="Tâches"
        onNewTask={isSuperAdmin ? () => { setNewTaskStatus('todo'); setShowNewTask(true); } : undefined}
        onClearCache={refetch}
        actions={
          <div className="flex items-center gap-2">
            {isSuperAdmin && impersonatedMember && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-amber-700">
                <UserCheck className="w-3.5 h-3.5" />
                Vue de {impersonatedMember.full_name}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher une tâche..."
                className="h-8 pl-8 pr-7 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#1A3A5C]/30 focus:border-[#1A3A5C]/40 w-44 placeholder-gray-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <Select value={filterProject || '__all__'} onValueChange={v => setFilterProject(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue placeholder="Tous les projets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous les projets</SelectItem>
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

            {isSuperAdmin && !impersonatedMemberId && (
              <Select value={filterMember || '__all__'} onValueChange={v => setFilterMember(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="Tous les membres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous les membres</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <MemberAvatar member={m} size="sm" />
                        {m.full_name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setShowCoproBulk(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-[#1A3A5C] border border-[#1A3A5C]/30 hover:border-[#1A3A5C]/60 hover:bg-[#1A3A5C]/5 rounded-lg transition-colors"
                  title="Créer des tâches par copropriété"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Par copropriété
                </button>
                <button
                  onClick={() => setShowImport(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importer
                </button>
              </>
            )}

            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-[#1A3A5C] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                title="Vue Tableau"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-[#1A3A5C] text-white' : 'text-gray-400 hover:text-gray-600'}`}
                title="Vue Liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      />

      <main className="flex-1 p-6 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Chargement des tâches...
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="h-full overflow-auto">
            <KanbanBoard
              columns={columns}
              tasks={filteredTasks}
              members={members}
              onTaskClick={handleTaskClick}
              onStatusChange={handleStatusChange}
              onAddTask={isSuperAdmin ? handleAddTask : undefined}
              onDeleteTask={isSuperAdmin ? deleteTask : undefined}
              onRenameColumn={(id, label) => updateColumn(id, { label })}
              onAddColumn={addColumn}
              onDeleteColumn={deleteColumn}
              canEdit={isSuperAdmin}
              canBulkAssign={true}
              onBulkUpdate={async (ids, updates) => {
                for (const id of ids) await updateTask(id, updates);
              }}
              onRefresh={() => {}}
              onChangeAssignees={async (taskId, memberIds) => {
                const task = tasks.find(t => t.id === taskId);
                if (task) await setTaskAssignees(taskId, memberIds, task.title);
              }}
            />
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <TaskListView
              tasks={filteredTasks}
              members={members}
              onTaskClick={handleTaskClick}
              onDeleteTask={isSuperAdmin ? deleteTask : undefined}
              canBulkAssign={true}
              onBulkUpdate={async (ids, updates) => {
                for (const id of ids) await updateTask(id, updates);
              }}
              onRefresh={() => {}}
            />

          </div>
        )}
      </main>

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={handleClosePanel}
          projects={projects}
          members={members}
          currentMemberId={currentMember?.id}
          readOnly={!isSuperAdmin}
          onDeleteTask={isSuperAdmin ? (id) => { deleteTask(id); handleClosePanel(); } : undefined}
          kanbanColumns={columns}
        />
      )}

      {isSuperAdmin && (
        <NewTaskModal
          open={showNewTask}
          onClose={() => setShowNewTask(false)}
          onSubmit={handleCreateTask}
          projects={projects}
          members={members}
        />
      )}

      {isSuperAdmin && (
        <BulkImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
          onImport={handleBulkImport}
          projects={projects}
          members={members}
          defaultProjectId={filterProject || null}
        />
      )}

      {isSuperAdmin && (
        <BulkCoproTaskModal
          open={showCoproBulk}
          onClose={() => setShowCoproBulk(false)}
          onImport={handleBulkImport}
          projects={projects}
          members={members}
          defaultProjectId={filterProject || null}
        />
      )}
    </AppLayout>
  );
}
