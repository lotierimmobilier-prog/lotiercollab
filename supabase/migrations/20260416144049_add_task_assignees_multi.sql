/*
  # Add multi-assignee support for tasks

  ## Summary
  Introduces a junction table `task_assignees` to allow multiple members to be
  assigned to a single task. The existing `assigned_to` column on `tasks` is kept
  for backward compatibility (primary assignee) but the authoritative list of
  assignees is now in `task_assignees`.

  ## New Tables
  - `task_assignees`
    - `task_id` (uuid, FK to tasks, ON DELETE CASCADE)
    - `member_id` (uuid, FK to members, ON DELETE CASCADE)
    - `created_at` (timestamptz)
    - PRIMARY KEY (task_id, member_id)

  ## Security
  - RLS enabled on `task_assignees`
  - Authenticated users can read all assignees
  - Only authenticated users can insert/delete (super_admin managed at app level)
*/

CREATE TABLE IF NOT EXISTS task_assignees (
  task_id   uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, member_id)
);

ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read task assignees"
  ON task_assignees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert task assignees"
  ON task_assignees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete task assignees"
  ON task_assignees FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS task_assignees_task_id_idx ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS task_assignees_member_id_idx ON task_assignees(member_id);
