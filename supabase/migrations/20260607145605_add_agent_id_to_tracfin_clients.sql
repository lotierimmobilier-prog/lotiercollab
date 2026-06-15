ALTER TABLE tracfin_clients ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES members(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tracfin_clients_agent_id ON tracfin_clients(agent_id);
