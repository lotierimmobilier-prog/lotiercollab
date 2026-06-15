-- Replace open SELECT policy: agents see only their own clients; super admins see all
DROP POLICY IF EXISTS "tracfin_clients_select" ON tracfin_clients;

CREATE POLICY "tracfin_clients_select" ON tracfin_clients FOR SELECT
  TO authenticated
  USING (
    -- Super admins see everything
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
    OR
    -- Agent sees only clients assigned to them
    agent_id IN (
      SELECT ur.member_id FROM user_roles ur WHERE ur.auth_user_id = auth.uid()
    )
    OR
    -- Clients with no agent assigned are visible to everyone (unassigned = shared)
    agent_id IS NULL
  );

-- Also restrict UPDATE/DELETE to owner or super_admin
DROP POLICY IF EXISTS "tracfin_clients_update" ON tracfin_clients;
CREATE POLICY "tracfin_clients_update" ON tracfin_clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
    OR agent_id IN (
      SELECT ur.member_id FROM user_roles ur WHERE ur.auth_user_id = auth.uid()
    )
    OR agent_id IS NULL
  );
