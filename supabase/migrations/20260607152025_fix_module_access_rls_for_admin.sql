-- Allow super admins to read any user's module access
CREATE POLICY "super_admin_select_module_access" ON user_module_access FOR SELECT
  TO authenticated USING (
    auth.uid() = auth_user_id
    OR EXISTS (
      SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Drop the old policy that was too restrictive
DROP POLICY "select_own_module_access" ON user_module_access;

-- Also allow super admins to delete rows (for reset)
CREATE POLICY "super_admin_delete_module_access" ON user_module_access FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );
