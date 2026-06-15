
/*
  # Fix agent RLS on tasks to include multi-assignee access

  The existing "Agent reads own assigned tasks" policy only checks tasks.assigned_to
  (the primary assignee field). Agents assigned via the task_assignees junction table
  were not able to see those tasks.

  This migration replaces all 4 agent task policies (SELECT, INSERT, UPDATE, DELETE)
  to also check membership in task_assignees, so any agent listed as an assignee
  can see and act on the task.
*/

-- DROP old agent policies
DROP POLICY IF EXISTS "Agent reads own assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Agent can insert tasks assigned to self" ON tasks;
DROP POLICY IF EXISTS "Agent can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Agent can delete own tasks" ON tasks;

-- SELECT: agent can see tasks where they are assigned_to OR in task_assignees
CREATE POLICY "Agent reads own assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND (
          ur.member_id = tasks.assigned_to
          OR EXISTS (
            SELECT 1 FROM task_assignees ta
            WHERE ta.task_id = tasks.id
              AND ta.member_id = ur.member_id
          )
        )
    )
  );

-- INSERT: agent can create tasks assigned to themselves
CREATE POLICY "Agent can insert tasks assigned to self"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND ur.member_id = tasks.assigned_to
    )
  );

-- UPDATE: agent can update tasks where they are assigned_to OR in task_assignees
CREATE POLICY "Agent can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND (
          ur.member_id = tasks.assigned_to
          OR EXISTS (
            SELECT 1 FROM task_assignees ta
            WHERE ta.task_id = tasks.id
              AND ta.member_id = ur.member_id
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND (
          ur.member_id = tasks.assigned_to
          OR EXISTS (
            SELECT 1 FROM task_assignees ta
            WHERE ta.task_id = tasks.id
              AND ta.member_id = ur.member_id
          )
        )
    )
  );

-- DELETE: agent can delete tasks where they are assigned_to OR in task_assignees
CREATE POLICY "Agent can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND (
          ur.member_id = tasks.assigned_to
          OR EXISTS (
            SELECT 1 FROM task_assignees ta
            WHERE ta.task_id = tasks.id
              AND ta.member_id = ur.member_id
          )
        )
    )
  );
