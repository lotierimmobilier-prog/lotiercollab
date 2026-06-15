-- Add private project support
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update member_can_see_project to allow owners to see their own private projects
CREATE OR REPLACE FUNCTION public.member_can_see_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    CASE
      -- Super admins see everything
      WHEN EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
      ) THEN true
      -- Owner always sees their own project
      WHEN EXISTS (
        SELECT 1 FROM projects p WHERE p.id = p_project_id AND p.owner_auth_user_id = auth.uid()
      ) THEN true
      -- Private projects not owned by user are hidden
      WHEN EXISTS (
        SELECT 1 FROM projects p WHERE p.id = p_project_id AND p.is_private = true
      ) THEN false
      -- Standard member_project_access logic
      WHEN NOT EXISTS (
        SELECT 1 FROM member_project_access mpa
        JOIN user_roles ur ON ur.member_id = mpa.member_id
        WHERE ur.auth_user_id = auth.uid()
      ) THEN true
      ELSE EXISTS (
        WITH RECURSIVE allowed_projects AS (
          SELECT mpa.project_id AS id
          FROM member_project_access mpa
          JOIN user_roles ur ON ur.member_id = mpa.member_id
          WHERE ur.auth_user_id = auth.uid()
          UNION ALL
          SELECT p.id
          FROM projects p
          JOIN allowed_projects ap ON p.parent_id = ap.id
        )
        SELECT 1 FROM allowed_projects WHERE id = p_project_id
      )
    END
$$;

-- Allow authenticated users to insert their own projects (private or public if super_admin)
DROP POLICY IF EXISTS "Super admins can insert projects" ON projects;
CREATE POLICY "Users can insert projects" ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Super admins can create any project
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
    OR
    -- Agents can only create private projects they own
    (is_private = true AND owner_auth_user_id = auth.uid())
  );

-- Allow owners to update/delete their own private projects
DROP POLICY IF EXISTS "Super admins can update projects" ON projects;
CREATE POLICY "Owners and super admins can update projects" ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
    OR owner_auth_user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
    OR owner_auth_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Super admins can delete projects" ON projects;
CREATE POLICY "Owners and super admins can delete projects" ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
    OR owner_auth_user_id = auth.uid()
  );
