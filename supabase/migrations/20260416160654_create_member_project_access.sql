/*
  # Create member project access table

  Allows admins to restrict which projects each member can see.
  
  1. New Tables
    - `member_project_access`
      - `member_id` (uuid, FK to members)
      - `project_id` (uuid, FK to projects)
      - `created_at` (timestamp)
  
  2. Logic
    - If a member has NO rows in this table → they see ALL projects (default unrestricted)
    - If a member has rows → they only see those specific projects
  
  3. Security
    - RLS enabled, authenticated users can read their own access rows
    - Only super_admins (via service role) can insert/delete
*/

CREATE TABLE IF NOT EXISTS member_project_access (
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (member_id, project_id)
);

ALTER TABLE member_project_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read own project access"
  ON member_project_access FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT ur.member_id FROM user_roles ur WHERE ur.auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert project access"
  ON member_project_access FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete project access"
  ON member_project_access FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );
