-- Update tracfin_dossiers with new fields and statuses
ALTER TABLE tracfin_dossiers
  ALTER COLUMN client_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS reference text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS property_address text,
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS transaction_amount numeric(15,2),
  ADD COLUMN IF NOT EXISTS deadline date;

-- Update dossier_type enum to include new types
ALTER TABLE tracfin_dossiers
  ALTER COLUMN dossier_type TYPE text;

-- Update status enum to include new statuses
ALTER TABLE tracfin_dossiers
  ALTER COLUMN status TYPE text;

-- Update risk_level on tracfin_clients to include very_high
ALTER TABLE tracfin_clients
  ALTER COLUMN risk_level TYPE text;
