/*
  # Add avatar_url to members and create notifications system

  1. Changes to members table
    - Add `avatar_url` column (text, nullable) to store profile photo URL

  2. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `recipient_member_id` (uuid, FK to members) - who receives the notification
      - `type` (text) - type of notification: 'task_assigned', 'comment_added', 'task_updated'
      - `title` (text) - notification title
      - `body` (text) - notification body
      - `task_id` (uuid, nullable FK to tasks)
      - `read` (boolean, default false)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on notifications
    - Policies: authenticated users can read/update their own notifications
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE members ADD COLUMN avatar_url text DEFAULT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'task_assigned',
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    recipient_member_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Members can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    recipient_member_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    recipient_member_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Members can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (
    recipient_member_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin')
  );

CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications(recipient_member_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
