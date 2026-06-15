CREATE TABLE user_module_access (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  module_memos boolean NOT NULL DEFAULT true,
  module_calendar boolean NOT NULL DEFAULT true,
  module_messaging boolean NOT NULL DEFAULT true,
  module_tracfin boolean NOT NULL DEFAULT true,
  module_projects boolean NOT NULL DEFAULT true,
  module_tasks boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE user_module_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_module_access" ON user_module_access FOR SELECT
  TO authenticated USING (auth.uid() = auth_user_id);

CREATE POLICY "super_admin_insert_module_access" ON user_module_access FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_update_module_access" ON user_module_access FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );
