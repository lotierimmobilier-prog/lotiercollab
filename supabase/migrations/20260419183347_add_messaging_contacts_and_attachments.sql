/*
  # Messagerie : contacts autorisés, équipes et pièces jointes

  1. Nouvelles tables
    - `messaging_teams`
      - Équipes nommées regroupant des membres pour la messagerie
    - `messaging_team_members`
      - Membres d'une équipe de messagerie
    - `member_messaging_contacts`
      - Liste blanche de contacts autorisés pour chaque membre
      - Si vide → le membre peut écrire à tout le monde
      - Si renseigné → il ne peut écrire qu'aux membres listés
    - `message_attachments`
      - Fichiers joints aux messages (stockés dans Supabase Storage)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Super admins gèrent les équipes et contacts
    - Membres voient leurs propres contacts autorisés
*/

CREATE TABLE IF NOT EXISTS messaging_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messaging_team_members (
  team_id uuid NOT NULL REFERENCES messaging_teams(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, member_id)
);

CREATE TABLE IF NOT EXISTS member_messaging_contacts (
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (member_id, contact_id)
);

CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  file_size bigint DEFAULT 0,
  uploaded_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messaging_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_messaging_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage messaging teams"
  ON messaging_teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins insert messaging teams"
  ON messaging_teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Super admins update messaging teams"
  ON messaging_teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Super admins delete messaging teams"
  ON messaging_teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Authenticated can view team members"
  ON messaging_team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins insert team members"
  ON messaging_team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Super admins delete team members"
  ON messaging_team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Members view their contacts"
  ON member_messaging_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = member_messaging_contacts.member_id OR ur.role = 'super_admin')
    )
  );

CREATE POLICY "Super admins insert contacts"
  ON member_messaging_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Super admins delete contacts"
  ON member_messaging_contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin')
  );

CREATE POLICY "Members view attachments in their conversations"
  ON message_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN message_conversation_members mcm ON mcm.conversation_id = m.conversation_id
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE m.id = message_attachments.message_id
        AND ur.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Members insert attachments in their conversations"
  ON message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN message_conversation_members mcm ON mcm.conversation_id = m.conversation_id
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE m.id = message_attachments.message_id
        AND ur.auth_user_id = auth.uid()
        AND ur.member_id = message_attachments.uploaded_by
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Authors delete their attachments"
  ON message_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = message_attachments.uploaded_by OR ur.role = 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_member_messaging_contacts_member ON member_messaging_contacts(member_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
