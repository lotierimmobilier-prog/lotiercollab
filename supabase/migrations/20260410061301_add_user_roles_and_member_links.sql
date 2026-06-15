
/*
  # User Roles & Member Links

  ## Summary
  Implements a role-based access system:
  - Super Admin (jerome.bouba@lotier-immobilier.com): full access to all tasks, all members, impersonation
  - Agent: sees only tasks assigned to them

  ## New Tables

  ### user_roles
  - Links auth.users (UUID) to a role ('super_admin' | 'agent') and optionally to a member row
  - `auth_user_id` — UUID of the Supabase auth user
  - `role` — 'super_admin' or 'agent'
  - `member_id` — optional FK to members table (links an agent to their member profile)

  ## Security
  - RLS enabled
  - Users can only read their own role row
  - Only super_admins can insert/update/delete roles (enforced via policy)
  - Tasks SELECT policy updated: agents see only tasks assigned to their member_id

  ## Notes
  1. jerome.bouba@lotier-immobilier.com is automatically granted super_admin
  2. New tasks RLS policy: super_admin sees all, agent sees only assigned tasks
*/

-- user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('super_admin', 'agent')),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Only super_admin can manage roles
CREATE POLICY "Super admin can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Grant jerome.bouba as super_admin (insert if not already present)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'jerome.bouba@lotier-immobilier.com';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO user_roles (auth_user_id, role)
    VALUES (v_user_id, 'super_admin')
    ON CONFLICT (auth_user_id) DO UPDATE SET role = 'super_admin';
  END IF;
END $$;

-- Update tasks RLS: drop old blanket policy, replace with role-aware ones
DROP POLICY IF EXISTS "Authenticated users can read tasks" ON tasks;

CREATE POLICY "Super admin reads all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Agent reads own assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND ur.member_id = tasks.assigned_to
    )
  );

-- Tasks insert/update/delete: super_admin full access, agent limited to own tasks
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;

CREATE POLICY "Super admin can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Agent can insert tasks assigned to self"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND ur.member_id = assigned_to
    )
  );

CREATE POLICY "Super admin can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Agent can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND ur.member_id = tasks.assigned_to
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND ur.member_id = tasks.assigned_to
    )
  );

CREATE POLICY "Super admin can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Agent can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role = 'agent'
        AND ur.member_id = tasks.assigned_to
    )
  );

-- Comments: same logic — super_admin all, agent only on visible tasks
DROP POLICY IF EXISTS "Authenticated users can read comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can update comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can delete comments" ON comments;

CREATE POLICY "Super admin reads all comments"
  ON comments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Agent reads comments on own tasks"
  ON comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN tasks t ON t.id = comments.task_id
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'agent' AND ur.member_id = t.assigned_to
    )
  );

CREATE POLICY "Super admin manages comments"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Agent inserts comments on own tasks"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN tasks t ON t.id = comments.task_id
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'agent' AND ur.member_id = t.assigned_to
    )
  );

CREATE POLICY "Super admin updates comments"
  ON comments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Super admin deletes comments"
  ON comments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));

-- Attachments
DROP POLICY IF EXISTS "Authenticated users can read attachments" ON attachments;
DROP POLICY IF EXISTS "Authenticated users can insert attachments" ON attachments;
DROP POLICY IF EXISTS "Authenticated users can update attachments" ON attachments;
DROP POLICY IF EXISTS "Authenticated users can delete attachments" ON attachments;

CREATE POLICY "Super admin reads all attachments"
  ON attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Agent reads attachments on own tasks"
  ON attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN tasks t ON t.id = attachments.task_id
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'agent' AND ur.member_id = t.assigned_to
    )
  );

CREATE POLICY "Super admin manages attachments"
  ON attachments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Super admin updates attachments"
  ON attachments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Super admin deletes attachments"
  ON attachments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));

-- Index for fast role lookups
CREATE INDEX IF NOT EXISTS user_roles_auth_user_id_idx ON user_roles(auth_user_id);
CREATE INDEX IF NOT EXISTS user_roles_member_id_idx ON user_roles(member_id);
