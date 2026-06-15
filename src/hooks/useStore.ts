import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sendEmailNotification } from '../lib/emailNotify';
import type { Task, Project, Member, Comment, Attachment, KanbanColumn, TaskRecurrence, Copropriete, Notification } from '../types';

async function notifyAssignment(taskId: string, taskTitle: string, assignedTo: string, actorName = '', projectName = '', priority = 'normal', dueDate = '', description = '') {
  await supabase.from('notifications').insert({
    recipient_member_id: assignedTo,
    type: 'task_assigned',
    title: 'Tâche assignée',
    body: taskTitle,
    task_id: taskId,
    read: false,
  });
  sendEmailNotification({
    event_type: 'task_assigned',
    recipient_member_id: assignedTo,
    vars: {
      actor_name: actorName,
      task_title: taskTitle,
      project_name: projectName,
      priority,
      due_date: dueDate,
      description,
    },
  });
}

async function fetchTaskAssignees(taskIds: string[]): Promise<Record<string, Member[]>> {
  if (taskIds.length === 0) return {};
  const { data } = await supabase
    .from('task_assignees')
    .select('task_id, member:members(*)')
    .in('task_id', taskIds);
  const map: Record<string, Member[]> = {};
  (data ?? []).forEach((row: { task_id: string; member: Member | Member[] }) => {
    const memberData = Array.isArray(row.member) ? row.member[0] : row.member;
    if (!memberData) return;
    if (!map[row.task_id]) map[row.task_id] = [];
    map[row.task_id].push(memberData);
  });
  return map;
}

export async function setTaskAssignees(taskId: string, memberIds: string[], taskTitle: string) {
  const { data: existing } = await supabase
    .from('task_assignees')
    .select('member_id')
    .eq('task_id', taskId);
  const existingIds = new Set((existing ?? []).map((r: { member_id: string }) => r.member_id));
  const toAdd = memberIds.filter(id => !existingIds.has(id));
  const toRemove = [...existingIds].filter(id => !memberIds.includes(id));
  if (toRemove.length > 0) {
    await supabase.from('task_assignees').delete().eq('task_id', taskId).in('member_id', toRemove);
  }
  if (toAdd.length > 0) {
    await supabase.from('task_assignees').insert(toAdd.map(member_id => ({ task_id: taskId, member_id })));
    for (const id of toAdd) {
      await notifyAssignment(taskId, taskTitle, id);
    }
  }
  const primary = memberIds[0] ?? null;
  await supabase.from('tasks').update({ assigned_to: primary, updated_at: new Date().toISOString() }).eq('id', taskId);
}

export function useKanbanColumns() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('kanban_columns').select('*').order('sort_order');
    if (data) setColumns(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addColumn = async (label: string) => {
    const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.sort_order)) : -1;
    const id = `col_${Date.now()}`;
    const dotColors = ['bg-orange-400', 'bg-teal-500', 'bg-pink-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-rose-500'];
    const dot_color = dotColors[columns.length % dotColors.length];
    const { data, error } = await supabase
      .from('kanban_columns')
      .insert({ id, label, dot_color, sort_order: maxOrder + 1 })
      .select()
      .single();
    if (data) setColumns(prev => [...prev, data]);
    return { data, error };
  };

  const updateColumn = async (id: string, updates: Partial<Pick<KanbanColumn, 'label' | 'dot_color'>>) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await supabase.from('kanban_columns').update(updates).eq('id', id);
  };

  const deleteColumn = async (id: string) => {
    setColumns(prev => prev.filter(c => c.id !== id));
    await supabase.from('kanban_columns').delete().eq('id', id);
  };

  return { columns, loading, refetch: fetch, addColumn, updateColumn, deleteColumn };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').order('sort_order').order('name');
    if (data) setProjects(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'children' | 'default_recurrence'> & { default_recurrence?: TaskRecurrence | null }) => {
    const siblings = projects.filter(p => p.parent_id === (project.parent_id ?? null));
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(p => p.sort_order)) : -1;
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, sort_order: maxOrder + 1 })
      .select()
      .single();
    if (data) setProjects(prev => [...prev, data]);
    return { data, error };
  };

  const moveProject = async (projectId: string, newParentId: string | null, newIndex: number) => {
    const siblings = projects
      .filter(p => p.parent_id === newParentId && p.id !== projectId)
      .sort((a, b) => a.sort_order - b.sort_order);

    const reordered = [...siblings];
    reordered.splice(newIndex, 0, projects.find(p => p.id === projectId)!);

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
      updates.map(u =>
        supabase.from('projects').update({ sort_order: u.sort_order, parent_id: u.parent_id }).eq('id', u.id)
      )
    );
  };

  const updateProject = async (id: string, updates: Partial<Pick<Project, 'name' | 'color' | 'default_recurrence'>>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    await supabase.from('projects').update(updates).eq('id', id);
  };

  const deleteProject = async (id: string) => {
    const idsToDelete: string[] = [];
    const collect = (pid: string) => {
      idsToDelete.push(pid);
      projects.filter(p => p.parent_id === pid).forEach(child => collect(child.id));
    };
    collect(id);

    setProjects(prev => prev.filter(p => !idsToDelete.includes(p.id)));

    for (const pid of idsToDelete) {
      await supabase.from('tasks').delete().eq('project_id', pid);
    }
    for (const pid of idsToDelete) {
      await supabase.from('projects').delete().eq('id', pid);
    }
  };

  return { projects, loading, refetch: fetch, createProject, moveProject, updateProject, deleteProject };
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('members').select('*').order('full_name');
    if (data) setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createMember = async (member: Omit<Member, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('members').insert(member).select().single();
    if (data) setMembers(prev => [...prev, data]);
    return { data, error };
  };

  const updateMember = async (id: string, updates: Partial<Omit<Member, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase.from('members').update(updates).eq('id', id).select().single();
    if (data) setMembers(prev => prev.map(m => m.id === id ? data : m));
    return { data, error };
  };

  const deleteMember = async (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    await supabase.from('members').delete().eq('id', id);
  };

  return { members, loading, refetch: fetch, createMember, updateMember, deleteMember };
}

export function useCoproprietes() {
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('coproprietes').select('*').order('sort_order').order('name');
    if (data) setCoproprietes(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createCopropriete = async (name: string, address = '') => {
    const maxOrder = coproprietes.length > 0 ? Math.max(...coproprietes.map(c => c.sort_order)) : -1;
    const { data, error } = await supabase
      .from('coproprietes')
      .insert({ name: name.trim(), address, sort_order: maxOrder + 1 })
      .select()
      .single();
    if (data) setCoproprietes(prev => [...prev, data]);
    return { data, error };
  };

  const bulkCreateCoproprietes = async (names: string[]) => {
    const existing = new Set(coproprietes.map(c => c.name.toLowerCase()));
    const toInsert = names
      .map(n => n.trim())
      .filter(n => n && !existing.has(n.toLowerCase()));

    if (toInsert.length === 0) return { inserted: 0 };

    const maxOrder = coproprietes.length > 0 ? Math.max(...coproprietes.map(c => c.sort_order)) : -1;
    const rows = toInsert.map((name, i) => ({ name, address: '', sort_order: maxOrder + 1 + i }));

    const { data, error } = await supabase.from('coproprietes').insert(rows).select();
    if (data) setCoproprietes(prev => [...prev, ...data]);
    return { inserted: data?.length ?? 0, error };
  };

  const updateCopropriete = async (id: string, updates: Partial<Pick<Copropriete, 'name' | 'address' | 'active'>>) => {
    const { data, error } = await supabase.from('coproprietes').update(updates).eq('id', id).select().single();
    if (data) setCoproprietes(prev => prev.map(c => c.id === id ? data : c));
    return { data, error };
  };

  const deleteCopropriete = async (id: string) => {
    setCoproprietes(prev => prev.filter(c => c.id !== id));
    await supabase.from('coproprietes').delete().eq('id', id);
  };

  return { coproprietes, loading, refetch: fetch, createCopropriete, bulkCreateCoproprietes, updateCopropriete, deleteCopropriete };
}

export function useTasks(filter?: { projectId?: string; memberId?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const channelId = useRef(`tasks-rt-${Math.random().toString(36).slice(2)}`);

  const fetch = useCallback(async () => {
    let query = supabase
      .from('tasks')
      .select(`*, project:projects(*), assignee:members!tasks_assigned_to_fkey(*), creator:members!tasks_created_by_fkey(*)`)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (filter?.projectId) query = query.eq('project_id', filter.projectId);
    if (filter?.memberId) query = query.eq('assigned_to', filter.memberId);

    const { data } = await query;
    if (data) {
      const taskIds = data.map(t => t.id);
      const assigneesMap = await fetchTaskAssignees(taskIds);
      const tasksWithCounts = await Promise.all(
        data.map(async (task) => {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id);
          return { ...task, comment_count: count ?? 0, assignees: assigneesMap[task.id] ?? [] };
        })
      );
      setTasks(tasksWithCounts);
    }
    setLoading(false);
  }, [filter?.projectId, filter?.memberId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const prevTask = tasks.find(t => t.id === id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const { error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) fetch();
    if (
      updates.assigned_to &&
      updates.assigned_to !== prevTask?.assigned_to &&
      prevTask?.title
    ) {
      await notifyAssignment(id, prevTask.title, updates.assigned_to);
    }
  };

  const createTask = async (task: Partial<Task>) => {
    const { id, created_at, updated_at, project, assignee, assignees, creator, comment_count, ...insertPayload } = task as Task & { assignees?: Member[]; comment_count?: number; assignee_ids?: string[] };
    delete (insertPayload as Record<string, unknown>).assignee_ids;
    const { data, error } = await supabase.from('tasks').insert(insertPayload).select(
      `*, project:projects(*), assignee:members!tasks_assigned_to_fkey(*), creator:members!tasks_created_by_fkey(*)`
    ).single();
    if (data) {
      setTasks(prev => [{ ...data, comment_count: 0 }, ...prev]);
      if (data.assigned_to) {
        await notifyAssignment(data.id, data.title, data.assigned_to);
      }
    }
    return { data, error };
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  return { tasks, loading, refetch: fetch, updateTask, createTask, deleteTask };
}

export function useTaskDetail(taskId: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const [taskRes, commentsRes, attachmentsRes, subtasksRes] = await Promise.all([
      supabase.from('tasks').select(`*, project:projects(*), assignee:members!tasks_assigned_to_fkey(*), creator:members!tasks_created_by_fkey(*)`).eq('id', taskId).single(),
      supabase.from('comments').select(`*, author:members(*)`).eq('task_id', taskId).order('created_at'),
      supabase.from('attachments').select(`*, uploader:members(*)`).eq('task_id', taskId).order('created_at'),
      supabase.from('tasks').select(`*, assignee:members!tasks_assigned_to_fkey(*)`).eq('parent_id', taskId).order('created_at'),
    ]);
    if (taskRes.data) {
      const assigneesMap = await fetchTaskAssignees([taskId]);
      setTask({ ...taskRes.data, assignees: assigneesMap[taskId] ?? [] });
    }
    if (commentsRes.data) setComments(commentsRes.data);
    if (attachmentsRes.data) setAttachments(attachmentsRes.data);
    if (subtasksRes.data) setSubtasks(subtasksRes.data);
    setLoading(false);
  }, [taskId]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`task-detail-${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `task_id=eq.${taskId}` }, () => {
        fetchTask();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [taskId, fetchTask]);

  const addComment = async (body: string, authorId: string) => {
    const { data } = await supabase
      .from('comments')
      .insert({ task_id: taskId, author_id: authorId, body })
      .select(`*, author:members(*)`)
      .single();
    if (data) {
      setComments(prev => [...prev, data]);
      if (task?.assigned_to && task.assigned_to !== authorId) {
        await supabase.from('notifications').insert({
          recipient_member_id: task.assigned_to,
          type: 'comment_added',
          title: 'Nouveau commentaire',
          body: body.length > 80 ? body.slice(0, 80) + '…' : body,
          task_id: taskId,
          read: false,
        });
        const authorMember = data.author as Member | null;
        sendEmailNotification({
          event_type: 'comment_added',
          recipient_member_id: task.assigned_to,
          vars: {
            actor_name: authorMember?.full_name ?? '',
            task_title: task.title ?? '',
            project_name: (task.project as { name?: string } | null)?.name ?? '',
            comment_body: body.length > 300 ? body.slice(0, 300) + '…' : body,
            comment_date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          },
        });
      }
    }
  };

  const updateTask = async (updates: Partial<Task> & { assigneeIds?: string[] }) => {
    if (!taskId) return;
    const prevTask = task;
    const { assigneeIds, ...dbUpdates } = updates;
    const { data } = await supabase
      .from('tasks')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select(`*, project:projects(*), assignee:members!tasks_assigned_to_fkey(*), creator:members!tasks_created_by_fkey(*)`)
      .single();
    if (data) {
      if (assigneeIds !== undefined) {
        await setTaskAssignees(taskId, assigneeIds, data.title);
        const assigneesMap = await fetchTaskAssignees([taskId]);
        setTask({ ...data, assignees: assigneesMap[taskId] ?? [] });
      } else {
        const assigneesMap = await fetchTaskAssignees([taskId]);
        setTask({ ...data, assignees: assigneesMap[taskId] ?? [] });
      }
      if (dbUpdates.assigned_to && dbUpdates.assigned_to !== prevTask?.assigned_to) {
        await notifyAssignment(taskId, data.title, dbUpdates.assigned_to);
      }
    }
  };

  const createSubtask = async (title: string, memberId: string | null) => {
    const { data } = await supabase
      .from('tasks')
      .insert({ title, parent_id: taskId, assigned_to: memberId, status: 'todo', priority: 'normal' })
      .select(`*, assignee:members!tasks_assigned_to_fkey(*)`)
      .single();
    if (data) setSubtasks(prev => [...prev, data]);
  };

  return { task, comments, attachments, subtasks, loading, refetch: fetchTask, addComment, updateTask, createSubtask };
}

export function useNotifications(memberId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelId = useRef(`notifs-rt-${Math.random().toString(36).slice(2)}`);

  const fetch = useCallback(async () => {
    if (!memberId) { setLoading(false); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
    setLoading(false);
  }, [memberId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!memberId) return;
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_member_id=eq.${memberId}`,
      }, () => { fetch(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [memberId, fetch]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!memberId) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('recipient_member_id', memberId).eq('read', false);
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  const createNotification = async (notif: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    const { data } = await supabase.from('notifications').insert({ ...notif, read: false }).select().single();
    if (data) setNotifications(prev => [data, ...prev]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification, createNotification, refetch: fetch };
}
