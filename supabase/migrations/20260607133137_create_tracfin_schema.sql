-- TracFin Clients (KYC)
CREATE TABLE IF NOT EXISTS tracfin_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id),
  client_type text NOT NULL DEFAULT 'individual' CHECK (client_type IN ('individual', 'legal_entity')),
  role text NOT NULL DEFAULT 'acquereur' CHECK (role IN ('vendeur', 'acquereur', 'bailleur', 'locataire', 'caution')),
  civility text,
  first_name text,
  last_name text,
  birth_date date,
  birth_place text,
  nationality text DEFAULT 'Française',
  company_name text,
  siret text,
  legal_form text,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'France',
  profession text,
  employer text,
  income_range text,
  income_source text,
  is_ppe boolean DEFAULT false,
  ppe_details text,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  doubt_level text DEFAULT 'none' CHECK (doubt_level IN ('none', 'low', 'medium', 'high')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  is_draft boolean DEFAULT false,
  kyc_completed boolean DEFAULT false,
  kyc_date timestamptz,
  signature_data text,
  signed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Beneficial Owners
CREATE TABLE IF NOT EXISTS tracfin_beneficial_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES tracfin_clients(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date,
  nationality text,
  ownership_percentage numeric(5,2),
  is_ppe boolean DEFAULT false,
  ppe_details text,
  id_document_type text,
  id_document_number text,
  created_at timestamptz DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS tracfin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id),
  client_id uuid REFERENCES tracfin_clients(id) ON DELETE SET NULL,
  transaction_type text NOT NULL DEFAULT 'sale' CHECK (transaction_type IN ('sale', 'purchase', 'rental')),
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  property_address text,
  property_type text,
  amount numeric(15,2),
  currency text DEFAULT 'EUR',
  payment_method text,
  funds_origin text,
  third_party_involved boolean DEFAULT false,
  third_party_details text,
  unusual_urgency boolean DEFAULT false,
  suspension_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Risk Assessments
CREATE TABLE IF NOT EXISTS tracfin_risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id),
  entity_type text NOT NULL CHECK (entity_type IN ('client', 'transaction')),
  entity_id uuid NOT NULL,
  score_income_coherence integer DEFAULT 0 CHECK (score_income_coherence BETWEEN 0 AND 10),
  score_funds_origin integer DEFAULT 0 CHECK (score_funds_origin BETWEEN 0 AND 10),
  score_third_parties integer DEFAULT 0 CHECK (score_third_parties BETWEEN 0 AND 10),
  score_legal_structure integer DEFAULT 0 CHECK (score_legal_structure BETWEEN 0 AND 10),
  score_geographic_risk integer DEFAULT 0 CHECK (score_geographic_risk BETWEEN 0 AND 10),
  score_payment_method integer DEFAULT 0 CHECK (score_payment_method BETWEEN 0 AND 10),
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance Alerts
CREATE TABLE IF NOT EXISTS tracfin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id),
  client_id uuid REFERENCES tracfin_clients(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES tracfin_transactions(id) ON DELETE SET NULL,
  alert_type text NOT NULL DEFAULT 'suspicious_activity',
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'closed', 'reported')),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TRACFIN Declarations (confidential)
CREATE TABLE IF NOT EXISTS tracfin_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id),
  client_id uuid REFERENCES tracfin_clients(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES tracfin_transactions(id) ON DELETE SET NULL,
  operation_nature text,
  operation_amount numeric(15,2),
  operation_date date,
  operation_currency text DEFAULT 'EUR',
  payment_method text,
  funds_origin text,
  suspicion_reason text NOT NULL DEFAULT '',
  suspicion_detected_at date,
  observed_facts text,
  inconsistencies text,
  indicator_refused_documents boolean DEFAULT false,
  indicator_large_cash boolean DEFAULT false,
  indicator_income_inconsistency boolean DEFAULT false,
  indicator_complex_structure boolean DEFAULT false,
  indicator_unusual_urgency boolean DEFAULT false,
  indicator_unknown_third_party boolean DEFAULT false,
  indicator_foreign_account boolean DEFAULT false,
  property_address text,
  property_type text,
  agency_name text,
  agency_address text,
  agency_rcs text,
  declarant_name text,
  declarant_role text,
  declarant_phone text,
  declarant_email text,
  signature_data text,
  signed_at timestamptz,
  signed_by uuid REFERENCES auth.users(id),
  signed_ip text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged')),
  submitted_at timestamptz,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance Dossiers
CREATE TABLE IF NOT EXISTS tracfin_dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id),
  client_id uuid REFERENCES tracfin_clients(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES tracfin_transactions(id) ON DELETE SET NULL,
  dossier_type text DEFAULT 'standard' CHECK (dossier_type IN ('standard', 'enhanced', 'suspicious')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'archived')),
  kyc_verified boolean DEFAULT false,
  risk_assessed boolean DEFAULT false,
  documents_complete boolean DEFAULT false,
  beneficial_owners_verified boolean DEFAULT false,
  verified_at timestamptz,
  archived_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tracfin_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracfin_beneficial_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracfin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracfin_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracfin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracfin_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracfin_dossiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tracfin_clients_select" ON tracfin_clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "tracfin_clients_insert" ON tracfin_clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tracfin_clients_update" ON tracfin_clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tracfin_clients_delete" ON tracfin_clients FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "tracfin_beneficial_owners_select" ON tracfin_beneficial_owners FOR SELECT TO authenticated USING (true);
CREATE POLICY "tracfin_beneficial_owners_insert" ON tracfin_beneficial_owners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tracfin_beneficial_owners_update" ON tracfin_beneficial_owners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tracfin_beneficial_owners_delete" ON tracfin_beneficial_owners FOR DELETE TO authenticated USING (true);

CREATE POLICY "tracfin_transactions_select" ON tracfin_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "tracfin_transactions_insert" ON tracfin_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tracfin_transactions_update" ON tracfin_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tracfin_transactions_delete" ON tracfin_transactions FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "tracfin_risk_assessments_select" ON tracfin_risk_assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "tracfin_risk_assessments_insert" ON tracfin_risk_assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tracfin_risk_assessments_update" ON tracfin_risk_assessments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tracfin_risk_assessments_delete" ON tracfin_risk_assessments FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "tracfin_alerts_select" ON tracfin_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "tracfin_alerts_insert" ON tracfin_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tracfin_alerts_update" ON tracfin_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tracfin_alerts_delete" ON tracfin_alerts FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "tracfin_declarations_select" ON tracfin_declarations FOR SELECT TO authenticated USING (true);
CREATE POLICY "tracfin_declarations_insert" ON tracfin_declarations FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tracfin_declarations_update" ON tracfin_declarations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tracfin_declarations_delete" ON tracfin_declarations FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "tracfin_dossiers_select" ON tracfin_dossiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "tracfin_dossiers_insert" ON tracfin_dossiers FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tracfin_dossiers_update" ON tracfin_dossiers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tracfin_dossiers_delete" ON tracfin_dossiers FOR DELETE TO authenticated USING (auth.uid() = created_by);
