
-- Create junction table
CREATE TABLE IF NOT EXISTS tracfin_transaction_parties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid NOT NULL REFERENCES tracfin_transactions(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL REFERENCES tracfin_clients(id)     ON DELETE CASCADE,
  party_role    text NOT NULL CHECK (party_role IN ('vendeur','acquereur','bailleur','locataire','caution')),
  created_at    timestamptz DEFAULT now(),
  UNIQUE (transaction_id, client_id)
);

ALTER TABLE tracfin_transaction_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_transaction_parties" ON tracfin_transaction_parties
FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_transaction_parties" ON tracfin_transaction_parties
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "delete_transaction_parties" ON tracfin_transaction_parties
FOR DELETE TO authenticated USING (true);

-- Add agent_id to tracfin_transactions
ALTER TABLE tracfin_transactions ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES members(id);

-- Populate junction table
INSERT INTO tracfin_transaction_parties (transaction_id, client_id, party_role)
SELECT tt.id, tt.client_id, COALESCE(tc.role, 'vendeur')
FROM tracfin_transactions tt
JOIN tracfin_clients tc ON tc.id = tt.client_id
WHERE tt.client_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Set agent_id on each transaction
UPDATE tracfin_transactions tt
SET agent_id = tc.agent_id
FROM tracfin_clients tc
WHERE tc.id = tt.client_id AND tc.agent_id IS NOT NULL;

-- Merge duplicates per address
DO $$
DECLARE
  addr_rec RECORD;
  canonical_id uuid;
  dup_id uuid;
BEGIN
  FOR addr_rec IN
    SELECT property_address FROM tracfin_transactions
    GROUP BY property_address HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO canonical_id FROM tracfin_transactions
    WHERE property_address = addr_rec.property_address
    ORDER BY (CASE WHEN transaction_type = 'sale' THEN 0 ELSE 1 END), created_at
    LIMIT 1;

    UPDATE tracfin_transactions SET transaction_type = 'sale' WHERE id = canonical_id;

    FOR dup_id IN
      SELECT id FROM tracfin_transactions
      WHERE property_address = addr_rec.property_address AND id != canonical_id
    LOOP
      -- Delete conflicting parties (already exist on canonical)
      DELETE FROM tracfin_transaction_parties
      WHERE transaction_id = dup_id
        AND client_id IN (
          SELECT client_id FROM tracfin_transaction_parties WHERE transaction_id = canonical_id
        );

      -- Move remaining parties to canonical
      UPDATE tracfin_transaction_parties
      SET transaction_id = canonical_id
      WHERE transaction_id = dup_id;

      DELETE FROM tracfin_transactions WHERE id = dup_id;
    END LOOP;

    -- Set agent_id from linked clients
    UPDATE tracfin_transactions SET agent_id = (
      SELECT tc.agent_id
      FROM tracfin_transaction_parties ttp
      JOIN tracfin_clients tc ON tc.id = ttp.client_id
      WHERE ttp.transaction_id = canonical_id AND tc.agent_id IS NOT NULL
      LIMIT 1
    ) WHERE id = canonical_id;
  END LOOP;
END $$;

-- Fix remaining agent_ids
UPDATE tracfin_transactions tt SET agent_id = (
  SELECT tc.agent_id FROM tracfin_transaction_parties ttp
  JOIN tracfin_clients tc ON tc.id = ttp.client_id
  WHERE ttp.transaction_id = tt.id AND tc.agent_id IS NOT NULL LIMIT 1
) WHERE tt.agent_id IS NULL;
