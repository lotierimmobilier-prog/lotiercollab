/*
  # Allow agents to create their own projects + Memos table

  ## Changes

  ### 1. Projects RLS — allow agents to insert
  - Drop the super-admin-only INSERT policy
  - Add a new INSERT policy that allows any authenticated user to create a project
  - Agents will see only their own projects (via existing member_project_access) plus projects they created

  ### 2. New table: memos
  - Personal notes/reminders per user
  - Fields: id, user_id, title, body, due_date, priority, done, created_at, updated_at
  - RLS: users can only CRUD their own memos
*/

-- ── 1. Allow agents to insert projects ──────────────────────────

DROP POLICY IF EXISTS "Super admins can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;

CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── 2. Memos table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text DEFAULT '',
  due_date date,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own memos"
  ON memos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memos"
  ON memos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memos"
  ON memos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memos"
  ON memos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS memos_user_id_idx ON memos(user_id);
CREATE INDEX IF NOT EXISTS memos_due_date_idx ON memos(due_date);
