/*
  # Allow agents to delete tasks and projects

  1. Changes
    - Add DELETE policy on `tasks` for agents who created the task
    - Add DELETE/INSERT/UPDATE policies on `projects` for agents (based on project access)

  2. Notes
    - Projects table has no created_by column, so agents can delete any project they have access to
    - Agents can already delete tasks they are assigned to; this extends to tasks they created
*/

-- Agents can delete tasks they created
CREATE POLICY "Agent can delete tasks they created"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND ur.member_id = tasks.created_by
    )
  );

-- Agents can delete projects they have access to
CREATE POLICY "Agent can delete projects they access"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
    )
    AND member_can_see_project(id)
  );

-- Agents can insert projects
CREATE POLICY "Agent can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
    )
  );

-- Agents can update projects they have access to
CREATE POLICY "Agent can update projects they access"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
    )
    AND member_can_see_project(id)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
    )
  );
