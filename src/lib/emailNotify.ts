import { supabase } from './supabase';

type EventType = 'task_assigned' | 'task_updated' | 'comment_added' | 'new_message' | 'memo_due';

interface NotifyPayload {
  event_type: EventType;
  recipient_member_id: string;
  vars: Record<string, string>;
}

export async function sendEmailNotification(payload: NotifyPayload): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  // Fire-and-forget — don't block UI on email delivery
  fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-notify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    }
  ).catch(() => { /* silent — email is best-effort */ });
}
