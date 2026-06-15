
-- Restrict transactions and related tables so agents only see records
-- linked to their own clients (via client.agent_id = their member_id)

-- ─── tracfin_transactions ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view transactions" ON tracfin_transactions;
DROP POLICY IF EXISTS "select_transactions" ON tracfin_transactions;

CREATE POLICY "select_transactions" ON tracfin_transactions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE auth_user_id = auth.uid() AND role = 'super_admin'
  )
  OR client_id IS NULL
  OR client_id IN (
    SELECT id FROM tracfin_clients
    WHERE agent_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR agent_id IS NULL
  )
);

DROP POLICY IF EXISTS "Authenticated users can update transactions" ON tracfin_transactions;
DROP POLICY IF EXISTS "update_transactions" ON tracfin_transactions;

CREATE POLICY "update_transactions" ON tracfin_transactions
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE auth_user_id = auth.uid() AND role = 'super_admin'
  )
  OR client_id IN (
    SELECT id FROM tracfin_clients
    WHERE agent_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR agent_id IS NULL
  )
)
WITH CHECK (true);

-- ─── tracfin_dossiers ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view dossiers" ON tracfin_dossiers;
DROP POLICY IF EXISTS "select_dossiers" ON tracfin_dossiers;

CREATE POLICY "select_dossiers" ON tracfin_dossiers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE auth_user_id = auth.uid() AND role = 'super_admin'
  )
  OR client_id IS NULL
  OR client_id IN (
    SELECT id FROM tracfin_clients
    WHERE agent_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR agent_id IS NULL
  )
);

DROP POLICY IF EXISTS "Authenticated users can update dossiers" ON tracfin_dossiers;
DROP POLICY IF EXISTS "update_dossiers" ON tracfin_dossiers;

CREATE POLICY "update_dossiers" ON tracfin_dossiers
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE auth_user_id = auth.uid() AND role = 'super_admin'
  )
  OR client_id IN (
    SELECT id FROM tracfin_clients
    WHERE agent_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR agent_id IS NULL
  )
)
WITH CHECK (true);

-- ─── tracfin_alerts ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view alerts" ON tracfin_alerts;
DROP POLICY IF EXISTS "select_alerts" ON tracfin_alerts;

CREATE POLICY "select_alerts" ON tracfin_alerts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE auth_user_id = auth.uid() AND role = 'super_admin'
  )
  OR client_id IS NULL
  OR client_id IN (
    SELECT id FROM tracfin_clients
    WHERE agent_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR agent_id IS NULL
  )
);

-- ─── tracfin_risk_assessments ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view risk assessments" ON tracfin_risk_assessments;
DROP POLICY IF EXISTS "select_risk_assessments" ON tracfin_risk_assessments;

CREATE POLICY "select_risk_assessments" ON tracfin_risk_assessments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE auth_user_id = auth.uid() AND role = 'super_admin'
  )
  OR entity_id IN (
    SELECT id FROM tracfin_clients
    WHERE agent_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR agent_id IS NULL
  )
);

-- ─── tracfin_declarations ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Only creators can view declarations" ON tracfin_declarations;
DROP POLICY IF EXISTS "select_declarations" ON tracfin_declarations;

CREATE POLICY "select_declarations" ON tracfin_declarations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE auth_user_id = auth.uid() AND role = 'super_admin'
  )
  OR client_id IN (
    SELECT id FROM tracfin_clients
    WHERE agent_id IN (
      SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid()
    )
    OR agent_id IS NULL
  )
);
