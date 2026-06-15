/*
  # Schedule daily memo due notifications

  Uses pg_cron + pg_net to call the memo-due-notify edge function
  every day at 07:00 UTC.

  The cron job fires an HTTP POST to the edge function URL using
  the service role key stored in vault (auto-managed by Supabase).
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'memo-due-notify-daily',
  '0 7 * * *',
  $$
    SELECT net.http_post(
      url    := current_setting('app.supabase_url') || '/functions/v1/memo-due-notify',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body   := '{}'::jsonb
    );
  $$
);
