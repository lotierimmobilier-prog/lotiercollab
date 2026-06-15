-- Add module_mydoc to user_module_access
ALTER TABLE user_module_access ADD COLUMN IF NOT EXISTS module_mydoc boolean NOT NULL DEFAULT true;

-- Property files table
CREATE TABLE IF NOT EXISTS property_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  type text NOT NULL CHECK (type IN ('VENTE', 'LOCATION', 'GESTION', 'DIVERS')),
  address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  owner_name text NOT NULL,
  agent_id uuid REFERENCES members(id),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'COMPLETE', 'ARCHIVED')),
  mandate_number text,
  mandate_status text CHECK (mandate_status IN ('SIGNED', 'PENDING')),
  is_copro boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE property_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_property_files" ON property_files FOR SELECT TO authenticated
  USING (
    agent_id = (SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid() LIMIT 1)
    OR EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "insert_property_files" ON property_files FOR INSERT TO authenticated
  WITH CHECK (
    agent_id = (SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid() LIMIT 1)
    OR EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "update_property_files" ON property_files FOR UPDATE TO authenticated
  USING (
    agent_id = (SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid() LIMIT 1)
    OR EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    agent_id = (SELECT member_id FROM user_roles WHERE auth_user_id = auth.uid() LIMIT 1)
    OR EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "delete_property_files" ON property_files FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));

-- Property file documents
CREATE TABLE IF NOT EXISTS property_file_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_file_id uuid NOT NULL REFERENCES property_files(id) ON DELETE CASCADE,
  category text NOT NULL,
  document_type text,
  filename text NOT NULL,
  file_size bigint,
  mime_type text,
  storage_path text,
  uploader_id uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE property_file_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_property_file_documents" ON property_file_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_property_file_documents" ON property_file_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "update_property_file_documents" ON property_file_documents FOR UPDATE TO authenticated
  USING (auth.uid() = uploader_id) WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "delete_property_file_documents" ON property_file_documents FOR DELETE TO authenticated
  USING (auth.uid() = uploader_id OR EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));

-- Property checklist items
CREATE TABLE IF NOT EXISTS property_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type text NOT NULL CHECK (property_type IN ('VENTE', 'LOCATION', 'GESTION', 'DIVERS')),
  label text NOT NULL,
  category text NOT NULL,
  required boolean DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_checklist_items" ON property_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_checklist_items" ON property_checklist_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "update_checklist_items" ON property_checklist_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "delete_checklist_items" ON property_checklist_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = auth.uid() AND role = 'super_admin'));

-- Default checklist items
INSERT INTO property_checklist_items (property_type, label, category, required, order_index) VALUES
  ('VENTE', 'Pièce d''identité propriétaire', 'Identité', true, 1),
  ('VENTE', 'Titre de propriété', 'Juridique', true, 2),
  ('VENTE', 'Diagnostic DPE', 'Diagnostics', true, 3),
  ('VENTE', 'Diagnostic électricité', 'Diagnostics', false, 4),
  ('VENTE', 'Diagnostic gaz', 'Diagnostics', false, 5),
  ('VENTE', 'Diagnostic amiante', 'Diagnostics', false, 6),
  ('VENTE', 'Mandat de vente signé', 'Mandat', true, 7),
  ('VENTE', 'Photos du bien', 'Médias', false, 8),
  ('LOCATION', 'Pièce d''identité propriétaire', 'Identité', true, 1),
  ('LOCATION', 'Titre de propriété', 'Juridique', true, 2),
  ('LOCATION', 'Diagnostic DPE', 'Diagnostics', true, 3),
  ('LOCATION', 'Diagnostic électricité', 'Diagnostics', false, 4),
  ('LOCATION', 'Mandat de location signé', 'Mandat', true, 5),
  ('LOCATION', 'Photos du bien', 'Médias', false, 6),
  ('GESTION', 'Pièce d''identité propriétaire', 'Identité', true, 1),
  ('GESTION', 'Titre de propriété', 'Juridique', true, 2),
  ('GESTION', 'Mandat de gestion signé', 'Mandat', true, 3),
  ('GESTION', 'RIB propriétaire', 'Financier', true, 4),
  ('DIVERS', 'Document principal', 'Général', false, 1)
ON CONFLICT DO NOTHING;

-- Storage bucket for property documents
INSERT INTO storage.buckets (id, name, public) VALUES ('property-documents', 'property-documents', false) ON CONFLICT DO NOTHING;
