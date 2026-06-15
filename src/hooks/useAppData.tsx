import { createContext, useContext, useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';
import type { Member, Project, Task, TaskRecurrence } from '../types';

// ── Shared assignees fetcher ────────────────────────────────────────
async function fetchTaskAssignees(taskIds: string[]): Promise<Record<string, Member[]>> {
  if (taskIds.length === 0) return {};
  const { data } = await supabase
    .from('task_assignees')
    .select('task_id, member:members(id,full_name,initials,email,avatar_color,avatar_url,role,created_at)')
    .in('task_id', taskIds);
  const map: Record<string, Member[]> = {};
  (data ?? []).forEach((row: { task_id: string; member: Member | Member[] }) => {
    const m = Array.isArray(row.member) ? row.member[0] : row.member;
    if (!m) return;
    if (!map[row.task_id]) map[row.task_id] = [];
    map[row.task_id].push(m);
  });
  return map;
}

// ── Batch comment count fetcher ─────────────────────────────────────
async function fetchCommentCounts(taskIds: string[]): Promise<Record<string, number>> {
  if (taskIds.length === 0) return {};
  const { data } = await supabase
    .from('comments')
    .select('task_id')
    .in('task_id', taskIds);
  const counts: Record<string, number> = {};
  (data ?? []).forEach((row: { task_id: string }) => {
    counts[row.task_id] = (counts[row.task_id] ?? 0) + 1;
  });
  return counts;
}

// ── Context types ───────────────────────────────────────────────────
interface AppDataContextValue {
  members: Member[];
  membersLoading: boolean;
  refetchMembers: () => Promise<void>;
  createMember: (member: Omit<Member, 'id' | 'created_at'>) => Promise<{ data: Member | null; error: { message: string } | null }>;
  updateMember: (id: string, updates: Partial<Omit<Member, 'id' | 'created_at'>>) => Promise<{ data: Member | null; error: { message: string } | null }>;
  deleteMember: (id: string) => Promise<void>;

  projects: Project[];
  projectsLoading: boolean;
  refetchProjects: () => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'children' | 'default_recurrence' | 'is_private' | 'owner_auth_user_id'> & { default_recurrence?: TaskRecurrence | null; is_private?: boolean; owner_auth_user_id?: string | null }) => Promise<{ data: Project | null; error: unknown }>;
  moveProject: (projectId: string, newParentId: string | null, newIndex: number) => Promise<void>;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'color' | 'default_recurrence'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  tasks: Task[];
  tasksLoading: boolean;
  refetchTasks: () => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTask: (task: Partial<Task>) => Promise<{ data: any; error: any }>;
  deleteTask: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const tasksChannelId = useRef(`tasks-rt-${Math.random().toString(36).slice(2)}`);
  // Resolved member id for the logged-in auth user (used in activity logs)
  const currentMemberIdRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('user_roles')
        .select('member_id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();
      currentMemberIdRef.current = data?.member_id ?? null;
    })();
  }, []);

  // ── Members ──────────────────────────────────────────────────────
  const refetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('members')
      .select('id,full_name,initials,email,avatar_color,avatar_url,role,created_at')
      .order('full_name');
    if (data) setMembers(data);
    setMembersLoading(false);
  }, []);

  const createMember = async (member: Omit<Member, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('members').insert(member).select().single();
    if (data) {
      setMembers(prev => [...prev, data]);
      logActivity({ action: 'member.created', entity_type: 'member', entity_id: data.id, entity_label: data.full_name, actor_member_id: currentMemberIdRef.current });
    }
    return { data, error };
  };

  const updateMember = async (id: string, updates: Partial<Omit<Member, 'id' | 'created_at'>>) => {
    const prev = members.find(m => m.id === id);
    const { data, error } = await supabase.from('members').update(updates).eq('id', id).select().single();
    if (data) {
      setMembers(p => p.map(m => m.id === id ? data : m));
      logActivity({ action: 'member.updated', entity_type: 'member', entity_id: id, entity_label: data.full_name, actor_member_id: currentMemberIdRef.current, details: { before: prev, changes: updates } });
    }
    return { data, error };
  };

  const deleteMember = async (id: string) => {
    const target = members.find(m => m.id === id);
    setMembers(prev => prev.filter(m => m.id !== id));
    await supabase.from('members').delete().eq('id', id);
    logActivity({ action: 'member.deleted', entity_type: 'member', entity_id: id, entity_label: target?.full_name, actor_member_id: currentMemberIdRef.current });
  };

  // ── Projects ─────────────────────────────────────────────────────
  const refetchProjects = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('id,name,color,parent_id,sort_order,default_recurrence,is_private,owner_auth_user_id,created_at')
      .order('sort_order')
      .order('name');
    if (data) setProjects(data);
    setProjectsLoading(false);
  }, []);

  const createProject = async (
    project: Omit<Project, 'id' | 'created_at' | 'children' | 'default_recurrence' | 'is_private' | 'owner_auth_user_id'> & { default_recurrence?: TaskRecurrence | null; is_private?: boolean; owner_auth_user_id?: string | null }
  ) => {
    const siblings = projects.filter(p => p.parent_id === (project.parent_id ?? null));
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(p => p.sort_order)) : -1;
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, sort_order: maxOrder + 1 })
      .select()
      .single();
    if (data) {
      setProjects(prev => [...prev, data]);
      const parentName = project.parent_id ? projects.find(p => p.id === project.parent_id)?.name : null;
      logActivity({ action: 'project.created', entity_type: 'project', entity_id: data.id, entity_label: data.name, actor_member_id: currentMemberIdRef.current, details: parentName ? { parent: parentName } : undefined });
    }
    return { data, error };
  };

  const moveProject = async (projectId: string, newParentId: string | null, newIndex: number) => {
    const movingProject = projects.find(p => p.id === projectId);
    const oldParent = movingProject?.parent_id ? projects.find(p => p.id === movingProject.parent_id) : null;
    const newParent = newParentId ? projects.find(p => p.id === newParentId) : null;
    const siblings = projects
      .filter(p => p.parent_id === newParentId && p.id !== projectId)
      .sort((a, b) => a.sort_order - b.sort_order);
    const reordered = [...siblings];
    reordered.splice(newIndex, 0, movingProject!);
    const updates = reordered.map((p, i) => ({
      id: p.id === projectId ? projectId : p.id,
      sort_order: i,
      parent_id: p.id === projectId ? newParentId : p.parent_id,
    }));
    setProjects(prev => prev.map(p => {
      const upd = updates.find(u => u.id === p.id);
      return upd ? { ...p, sort_order: upd.sort_order, parent_id: upd.parent_id } : p;
    }));
    await Promise.all(
      updates.map(u => supabase.from('projects').update({ sort_order: u.sort_order, parent_id: u.parent_id }).eq('id', u.id))
    );
    if (oldParent?.id !== newParentId) {
      logActivity({ action: 'project.moved', entity_type: 'project', entity_id: projectId, entity_label: movingProject?.name, actor_member_id: currentMemberIdRef.current, details: { from_parent: oldParent?.name ?? null, to_parent: newParent?.name ?? null } });
    }
  };

  const updateProject = async (id: string, updates: Partial<Pick<Project, 'name' | 'color' | 'default_recurrence'>>) => {
    const prev = projects.find(p => p.id === id);
    setProjects(p => p.map(proj => proj.id === id ? { ...proj, ...updates } : proj));
    await supabase.from('projects').update(updates).eq('id', id);
    logActivity({ action: 'project.updated', entity_type: 'project', entity_id: id, entity_label: updates.name ?? prev?.name, actor_member_id: currentMemberIdRef.current, details: { changes: updates } });
  };

  const deleteProject = async (id: string) => {
    const target = projects.find(p => p.id === id);
    const idsToDelete: string[] = [];
    const collect = (pid: string) => {
      idsToDelete.push(pid);
      projects.filter(p => p.parent_id === pid).forEach(child => collect(child.id));
    };
    collect(id);
    setProjects(prev => prev.filter(p => !idsToDelete.includes(p.id)));
    await supabase.from('tasks').delete().in('project_id', idsToDelete);
    await supabase.from('projects').delete().in('id', idsToDelete);
    logActivity({ action: 'project.deleted', entity_type: 'project', entity_id: id, entity_label: target?.name, actor_member_id: currentMemberIdRef.current, details: { also_deleted_children: idsToDelete.length - 1 } });
  };

  // ── Tasks ────────────────────────────────────────────────────────
  const refetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select(`
        id,title,description,project_id,assigned_to,status,priority,due_date,
        created_by,parent_id,recurrence,next_recurrence_date,created_at,updated_at,
        project:projects(id,name,color,parent_id,sort_order,default_recurrence,created_at),
        assignee:members!tasks_assigned_to_fkey(id,full_name,initials,email,avatar_color,avatar_url,role,created_at),
        creator:members!tasks_created_by_fkey(id,full_name,initials,email,avatar_color,avatar_url,role,created_at)
      `)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (data) {
      const taskIds = data.map(t => t.id);
      // Single batch query for all assignees and all comment counts
      const [assigneesMap, commentCounts] = await Promise.all([
        fetchTaskAssignees(taskIds),
        fetchCommentCounts(taskIds),
      ]);
      setTasks(data.map(task => ({
        ...task,
        comment_count: commentCounts[task.id] ?? 0,
        assignees: assigneesMap[task.id] ?? [],
      })) as unknown as Task[]);
    }
    setTasksLoading(false);
  }, []);

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const prev = tasks.find(t => t.id === id);
    setTasks(t => t.map(task => task.id === id ? { ...task, ...updates } : task));
    const { error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) refetchTasks();
    // Determine most specific action
    let action: Parameters<typeof logActivity>[0]['action'] = 'task.updated';
    if (updates.status && prev?.status !== updates.status) action = 'task.status_changed';
    else if (updates.assigned_to !== undefined && prev?.assigned_to !== updates.assigned_to) action = 'task.assigned';
    logActivity({
      action,
      entity_type: 'task',
      entity_id: id,
      entity_label: prev?.title,
      actor_member_id: currentMemberIdRef.current,
      details: action === 'task.status_changed'
        ? { from: prev?.status, to: updates.status, project: prev?.project?.name }
        : action === 'task.assigned'
        ? { assignee_id: updates.assigned_to, project: prev?.project?.name }
        : { changes: updates },
    });
  };

  const createTask = async (task: Partial<Task>) => {
    const { id, created_at, updated_at, project, assignee, assignees, creator, comment_count, ...insertPayload } = task as Task & { assignees?: Member[]; comment_count?: number; assignee_ids?: string[] };
    delete (insertPayload as Record<string, unknown>).assignee_ids;
    const { data, error } = await supabase.from('tasks').insert(insertPayload).select(
      `id,title,description,project_id,assigned_to,status,priority,due_date,created_by,parent_id,recurrence,next_recurrence_date,created_at,updated_at,
       project:projects(id,name,color,parent_id,sort_order,default_recurrence,created_at),
       assignee:members!tasks_assigned_to_fkey(id,full_name,initials,email,avatar_color,avatar_url,role,created_at),
       creator:members!tasks_created_by_fkey(id,full_name,initials,email,avatar_color,avatar_url,role,created_at)`
    ).single();
    if (data) {
      setTasks(prev => [{ ...data, comment_count: 0, assignees: [] } as unknown as Task, ...prev]);
      const projectName = projects.find(p => p.id === data.project_id)?.name;
      logActivity({ action: 'task.created', entity_type: 'task', entity_id: data.id, entity_label: data.title, actor_member_id: currentMemberIdRef.current, details: { project: projectName, priority: data.priority } });
    }
    return { data, error };
  };

  const deleteTask = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
    logActivity({ action: 'task.deleted', entity_type: 'task', entity_id: id, entity_label: target?.title, actor_member_id: currentMemberIdRef.current, details: { project: target?.project?.name } });
  };

  // ── Initial load (parallel) ───────────────────────────────────────
  useEffect(() => {
    refetchMembers();
    refetchProjects();
    refetchTasks();
  }, [refetchMembers, refetchProjects, refetchTasks]);

  // ── Real-time tasks subscription ──────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(tasksChannelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        refetchTasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetchTasks]);

  return (
    <AppDataContext.Provider value={{
      members, membersLoading, refetchMembers, createMember, updateMember, deleteMember,
      projects, projectsLoading, refetchProjects, createProject, moveProject, updateProject, deleteProject,
      tasks, tasksLoading, refetchTasks, updateTask, createTask, deleteTask,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}
