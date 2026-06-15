/*
  # Restrict delete/insert/update on projects and tasks to super_admin only

  Removes the overly permissive agent policies added previously.
  Only super_admin should be able to create, modify, or delete tasks and projects.
*/

DROP POLICY IF EXISTS "Agent can delete tasks they created" ON tasks;
DROP POLICY IF EXISTS "Agent can delete projects they access" ON projects;
DROP POLICY IF EXISTS "Agent can insert projects" ON projects;
DROP POLICY IF EXISTS "Agent can update projects they access" ON projects;
