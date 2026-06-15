/*
  # Restriction d'accès aux projets par membre

  Remplace les politiques RLS ouvertes sur la table projects par des politiques qui
  respectent la table member_project_access :
  - Si un membre a des entrées dans member_project_access → il voit uniquement ces projets
    et leurs sous-projets (récursivement)
  - Si un membre n'a pas d'entrées → il voit tous les projets (comportement par défaut)
  - Les super_admins voient toujours tout

  Seuls les super_admins peuvent modifier/supprimer les projets.
*/

DROP POLICY IF EXISTS "Authenticated users can read projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;

CREATE OR REPLACE FUNCTION public.member_can_see_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    CASE
      WHEN EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
      ) THEN true
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

CREATE POLICY "Members see allowed projects"
  ON projects FOR SELECT
  TO authenticated
  USING (public.member_can_see_project(id));

CREATE POLICY "Super admins can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );
