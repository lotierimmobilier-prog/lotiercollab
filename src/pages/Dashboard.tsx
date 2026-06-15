import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SquareCheck as CheckSquare,
  Clock,
  TriangleAlert as AlertTriangle,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Plus,
  ChevronRight,
  Flame,
  CalendarDays,
  FolderOpen,
  Layers,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Topbar } from '../components/layout/Topbar';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { MemberAvatar } from '../components/common/MemberAvatar';
import { ProjectBadge } from '../components/common/ProjectBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import { formatRelativeDate } from '../lib/dateUtils';
import { priorityConfig } from '../lib/priorityUtils';
import { GlobalSearch } from '../components/dashboard/GlobalSearch';
import type { Task } from '../types';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentBg: string;
  accentBorder: string;
  valueColor?: string;
  subtitle?: string;
}

function StatCard({ label, value, icon, accentBg, accentBorder, valueColor, subtitle }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 border ${accentBorder} hover:shadow-lg transition-all duration-200 group relative overflow-hidden`}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${accentBg} opacity-[0.03]`} />
      <div className="relative">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${accentBg}`}>
          {icon}
        </div>
        <p className={`text-3xl font-bold tabular-nums tracking-tight ${valueColor ?? 'text-gray-900'}`}>
          {value}
        </p>
        <p className="text-sm text-gray-500 font-medium mt-0.5">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const { label, status } = formatRelativeDate(task.due_date);
  const prio = priorityConfig[task.priority];

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 px-5 py-3.5 hover:bg-[#1A3A5C]/[0.02] cursor-pointer transition-colors border-b border-gray-50 last:border-0"
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${prio.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#1A3A5C] transition-colors">
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.project && <ProjectBadge project={task.project} size="sm" />}
          {task.comment_count !== undefined && task.comment_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MessageSquare className="w-3 h-3" />
              {task.comment_count}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <StatusBadge status={task.status} />
        {label && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            status === 'overdue' ? 'text-red-600 bg-red-50' :
            status === 'soon' || status === 'today' ? 'text-amber-600 bg-amber-50' :
            'text-gray-500 bg-gray-100'
          }`}>{label}</span>
        )}
        {(() => {
          const list = task.assignees && task.assignees.length > 0
            ? task.assignees
            : task.assignee ? [task.assignee] : [];
          if (list.length === 0) return null;
          const visible = list.slice(0, 3);
          const extra = list.length - visible.length;
          return (
            <div className="flex items-center -space-x-1.5">
              {visible.map(m => (
                <div key={m.id} className="ring-2 ring-white rounded-full">
                  <MemberAvatar member={m} size="sm" />
                </div>
              ))}
              {extra > 0 && (
                <div className="ring-2 ring-white rounded-full w-6 h-6 flex items-center justify-center bg-gray-200 text-[10px] font-bold text-gray-600">
                  +{extra}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { tasks, tasksLoading: loading, projects, members } = useAppData();
  const { memberId, user } = useAuth();
  const navigate = useNavigate();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const firstName = user?.email?.split('@')[0]?.split('.')[0] ?? 'vous';
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const stats = useMemo(() => {
    const total = tasks.filter(t => t.status !== 'done').length;
    const dueToday = tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      const d = new Date(t.due_date + 'T00:00:00');
      return d.getTime() === today.getTime();
    }).length;
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      const d = new Date(t.due_date + 'T00:00:00');
      return d < today;
    }).length;
    const doneThisWeek = tasks.filter(t => {
      if (t.status !== 'done') return false;
      const d = new Date(t.updated_at);
      return d >= weekAgo;
    }).length;
    return { total, dueToday, overdue, doneThisWeek };
  }, [tasks]);

  const recentTasks = useMemo(() =>
    [...tasks]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 8),
    [tasks]
  );

  const urgentTasks = useMemo(() =>
    tasks.filter(t => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high')).slice(0, 5),
    [tasks]
  );

  const dueTodayTasks = useMemo(() =>
    tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      const d = new Date(t.due_date + 'T00:00:00');
      return d.getTime() === today.getTime();
    }).slice(0, 4),
    [tasks]
  );

  const activeProjects = useMemo(() =>
    projects.filter(p => !p.parent_id).slice(0, 6),
    [projects]
  );

  return (
    <AppLayout>
      <Topbar title="Tableau de bord" onNewTask={() => navigate('/tasks?new=1')} />

      <main className="flex-1 overflow-auto bg-[#F7F8FA]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-gray-400">
              <span className="w-5 h-5 border-2 border-gray-200 border-t-[#1A3A5C] rounded-full animate-spin" />
              Chargement...
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

            {/* Header */}
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {greeting}, <span className="text-[#1A3A5C]">{capitalizedName}</span>
                </h1>
                <p className="text-gray-500 text-sm mt-1.5">
                  {stats.total === 0
                    ? 'Aucune tâche active pour le moment.'
                    : `Vous avez ${stats.total} tâche${stats.total > 1 ? 's' : ''} active${stats.total > 1 ? 's' : ''}.`}
                  {stats.overdue > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 text-red-500 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {stats.overdue} en retard
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => navigate('/tasks?new=1')}
                className="flex-shrink-0 flex items-center gap-2 bg-[#1A3A5C] hover:bg-[#142d47] text-white text-sm font-semibold px-5 h-10 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                Nouvelle tâche
              </button>
            </div>

            {/* Global search */}
            <GlobalSearch />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Tâches actives"
                value={stats.total}
                icon={<Layers className="w-4.5 h-4.5 text-[#1A3A5C]" />}
                accentBg="bg-[#1A3A5C]/10"
                accentBorder="border-gray-100 hover:border-[#1A3A5C]/20"
              />
              <StatCard
                label="Échéances aujourd'hui"
                value={stats.dueToday}
                icon={<CalendarDays className="w-4.5 h-4.5 text-amber-600" />}
                accentBg="bg-amber-50"
                accentBorder="border-gray-100 hover:border-amber-200"
                valueColor={stats.dueToday > 0 ? 'text-amber-600' : 'text-gray-900'}
              />
              <StatCard
                label="En retard"
                value={stats.overdue}
                icon={<AlertTriangle className="w-4.5 h-4.5 text-red-500" />}
                accentBg="bg-red-50"
                accentBorder={stats.overdue > 0 ? 'border-red-100 hover:border-red-200' : 'border-gray-100 hover:border-red-100'}
                valueColor={stats.overdue > 0 ? 'text-red-500' : 'text-gray-900'}
              />
              <StatCard
                label="Terminées cette semaine"
                value={stats.doneThisWeek}
                icon={<TrendingUp className="w-4.5 h-4.5 text-emerald-600" />}
                accentBg="bg-emerald-50"
                accentBorder="border-gray-100 hover:border-emerald-200"
                valueColor={stats.doneThisWeek > 0 ? 'text-emerald-600' : 'text-gray-900'}
              />
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Recent Tasks - left, takes 2 cols */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#1A3A5C]/8 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-[#1A3A5C]" />
                      </div>
                      <h2 className="font-semibold text-gray-900 text-sm">Activité récente</h2>
                    </div>
                    <button
                      onClick={() => navigate('/tasks')}
                      className="flex items-center gap-1 text-xs text-[#1A3A5C] hover:text-[#142d47] font-semibold transition-colors group"
                    >
                      Voir toutes
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                  <div>
                    {recentTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                          <CheckSquare className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Aucune tâche pour le moment</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">Commencez par créer votre première tâche</p>
                        <button
                          onClick={() => navigate('/tasks?new=1')}
                          className="flex items-center gap-1.5 text-xs text-white bg-[#1A3A5C] hover:bg-[#142d47] font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Créer une tâche
                        </button>
                      </div>
                    ) : (
                      recentTasks.map(task => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onClick={() => setSelectedTaskId(task.id)}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Active projects */}
                {activeProjects.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#B89968]/10 flex items-center justify-center">
                          <FolderOpen className="w-3.5 h-3.5 text-[#B89968]" />
                        </div>
                        <h2 className="font-semibold text-gray-900 text-sm">Projets actifs</h2>
                      </div>
                      <button
                        onClick={() => navigate('/projects')}
                        className="flex items-center gap-1 text-xs text-[#1A3A5C] hover:text-[#142d47] font-semibold transition-colors group"
                      >
                        Voir tous
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activeProjects.map(project => {
                        const count = tasks.filter(t => t.project_id === project.id && t.status !== 'done').length;
                        const total = tasks.filter(t => t.project_id === project.id).length;
                        const done = total - count;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <button
                            key={project.id}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="flex flex-col gap-2.5 p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-gray-50/60 hover:bg-white transition-all duration-150 text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: project.color }}
                              />
                              <span className="text-xs font-semibold text-gray-800 truncate flex-1 group-hover:text-[#1A3A5C] transition-colors">
                                {project.name}
                              </span>
                            </div>
                            <div className="w-full">
                              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%`, backgroundColor: project.color }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[11px] text-gray-400">{count} active{count !== 1 ? 's' : ''}</span>
                                <span className="text-[11px] font-semibold text-gray-500">{pct}%</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-5">

                {/* Urgent tasks */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                      <Flame className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <h2 className="font-semibold text-gray-900 text-sm">Priorité haute / urgente</h2>
                  </div>
                  <div className="p-4 space-y-2">
                    {urgentTasks.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-2">
                          <CheckSquare className="w-5 h-5 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Aucune tâche urgente</p>
                      </div>
                    ) : (
                      urgentTasks.map(task => {
                        const prio = priorityConfig[task.priority];
                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`border-l-2 pl-3 py-2.5 pr-3 rounded-r-xl hover:bg-gray-50 cursor-pointer transition-all duration-150 ${
                              task.priority === 'urgent' ? 'border-red-500 bg-red-50/30' : 'border-amber-400 bg-amber-50/20'
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{task.title}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              {task.project && <ProjectBadge project={task.project} size="sm" />}
                              <span className={`text-[11px] font-bold uppercase tracking-wide ${prio.text}`}>{prio.label}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Due today */}
                {dueTodayTasks.length > 0 && (
                  <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-amber-100 bg-amber-50/40">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                        <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <h2 className="font-semibold text-gray-900 text-sm">À faire aujourd'hui</h2>
                      <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        {dueTodayTasks.length}
                      </span>
                    </div>
                    <div className="p-3 space-y-1">
                      {dueTodayTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="flex items-center gap-2.5 py-2.5 px-2.5 hover:bg-amber-50/60 rounded-xl cursor-pointer transition-colors group"
                        >
                          <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                          <p className="text-sm text-gray-800 font-medium truncate flex-1 group-hover:text-[#1A3A5C] transition-colors">{task.title}</p>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick stats mini card */}
                <div className="bg-[#1A3A5C] rounded-2xl p-5 shadow-sm overflow-hidden relative">
                  <div className="absolute inset-0 opacity-[0.06]">
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white" />
                  </div>
                  <div className="relative">
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">Vue d'ensemble</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Projets actifs</span>
                        <span className="text-white font-bold tabular-nums">{activeProjects.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Membres</span>
                        <span className="text-white font-bold tabular-nums">{members.length}</span>
                      </div>
                      <div className="h-px bg-white/10 my-1" />
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Taux complétion</span>
                        <span className="text-[#B89968] font-bold tabular-nums">
                          {tasks.length > 0
                            ? `${Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)}%`
                            : '—'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/tasks')}
                      className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white border border-white/20 hover:border-white/40 py-2 rounded-xl transition-all duration-150"
                    >
                      Voir toutes les tâches
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          projects={projects}
          members={members}
          currentMemberId={memberId ?? undefined}
          readOnly={false}
        />
      )}
    </AppLayout>
  );
}
