/*
  # Create activity_logs table

  ## Purpose
  Tracks all significant user actions in the application for audit purposes.

  ## New Table: activity_logs
  - id (uuid, primary key)
  - actor_member_id (uuid, nullable) — the member who performed the action
  - actor_auth_user_id (uuid, nullable) — the auth user id for correlation
  - action (text) — machine-readable action key e.g. "project.created"
  - entity_type (text) — e.g. "project", "task", "member"
  - entity_id (text, nullable) — the affected record id
  - entity_label (text, nullable) — human-readable name at the time of action
  - details (jsonb, nullable) — extra context (old/new values, parent names, etc.)
  - ip_address (text, nullable)
  - created_at (timestamptz)

  ## Security
  - RLS enabled
  - Super admins (via user_roles) can SELECT all rows
  - Any authenticated user can INSERT their own log entries
  - No UPDATE or DELETE allowed — logs are immutable
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_member_id  uuid REFERENCES members(id) ON DELETE SET NULL,
  actor_auth_user_id uuid,
  action           text NOT NULL,
  entity_type      text,
  entity_id        text,
  entity_label     text,
  details          jsonb,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_actor_member_idx ON activity_logs (actor_member_id);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx ON activity_logs (action);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can read all logs
CREATE POLICY "Super admins can read all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
        AND user_roles.role = 'super_admin'
    )
  );

-- Any authenticated user can insert their own log
CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (actor_auth_user_id = auth.uid());
