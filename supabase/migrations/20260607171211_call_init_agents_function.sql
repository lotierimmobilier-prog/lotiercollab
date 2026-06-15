
SELECT net.http_post(
  url := 'https://zkbjsvqlticiesohfewp.supabase.co/functions/v1/init-agents',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body := '{}'::jsonb
);
