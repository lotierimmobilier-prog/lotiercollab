import { supabase } from './supabase';

export type ActivityAction =
  // Auth
  | 'auth.login'
  | 'auth.logout'
  // Projects
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.moved'
  // Tasks
  | 'task.created'
  | 'task.updated'
  | 'task.status_changed'
  | 'task.assigned'
  | 'task.deleted'
  | 'task.moved'
  // Members
  | 'member.created'
  | 'member.updated'
  | 'member.deleted'
  // Memos
  | 'memo.created'
  | 'memo.updated'
  | 'memo.deleted';

interface LogPayload {
  action: ActivityAction;
  entity_type?: string;
  entity_id?: string;
  entity_label?: string;
  details?: Record<string, unknown>;
  actor_member_id?: string | null;
}

export async function logActivity(payload: LogPayload): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from('activity_logs').insert({
    actor_auth_user_id: session.user.id,
    actor_member_id: payload.actor_member_id ?? null,
    action: payload.action,
    entity_type: payload.entity_type ?? null,
    entity_id: payload.entity_id ?? null,
    entity_label: payload.entity_label ?? null,
    details: payload.details ?? null,
  });
}
