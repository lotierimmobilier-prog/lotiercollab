
-- Drop old conflicting policies
DROP POLICY IF EXISTS "select_transactions" ON tracfin_transactions;
DROP POLICY IF EXISTS "tracfin_transactions_select" ON tracfin_transactions;
DROP POLICY IF EXISTS "update_transactions" ON tracfin_transactions;
DROP POLICY IF EXISTS "tracfin_transactions_update" ON tracfin_transactions;

-- SELECT: super_admin sees all; agent sees transactions where agent_id = their member_id OR agent_id IS NULL
CREATE POLICY "select_transactions" ON tracfin_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
    OR agent_id IS NULL
    OR agent_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
  );

-- UPDATE: same logic
CREATE POLICY "update_transactions" ON tracfin_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
    OR agent_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
  );
