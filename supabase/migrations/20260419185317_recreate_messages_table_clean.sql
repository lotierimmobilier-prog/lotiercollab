
/*
  # Recréation propre de la table messages

  ## Problème
  La table messages était corrompue : deux colonnes `id`, deux clés primaires,
  et des colonnes issues de la structure interne Supabase Realtime (inserted_at, topic, extension, etc.)

  ## Solution
  Suppression et recréation complète de la table avec la bonne structure,
  les bonnes contraintes et les bonnes politiques RLS.

  ## Nouvelle structure
  - `id` (uuid, PK)
  - `conversation_id` (uuid, FK → message_conversations)
  - `author_id` (uuid, FK → members)
  - `body` (text)
  - `reply_to_id` (uuid, FK → messages, self-referencing)
  - `cited_task_id` (uuid, FK → tasks)
  - `cited_task_title` (text)
  - `edited_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Sécurité
  RLS activé avec politiques pour membres et super_admin
*/

DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
  author_id uuid REFERENCES members(id) ON DELETE SET NULL,
  body text NOT NULL DEFAULT '',
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  cited_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  cited_task_title text,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  file_size bigint DEFAULT 0,
  uploaded_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM message_conversation_members mcm
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE mcm.conversation_id = messages.conversation_id
        AND ur.auth_user_id = auth.uid()
    )) OR (EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    ))
  );

CREATE POLICY "Members can insert messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM message_conversation_members mcm
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE mcm.conversation_id = messages.conversation_id
        AND ur.auth_user_id = auth.uid()
        AND ur.member_id = messages.author_id
    )) OR (EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    ))
  );

CREATE POLICY "Authors can update their messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = messages.author_id OR ur.role = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = messages.author_id OR ur.role = 'super_admin')
    )
  );

CREATE POLICY "Authors can delete their messages"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = messages.author_id OR ur.role = 'super_admin')
    )
  );

CREATE POLICY "Members can view attachments in their conversations"
  ON message_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN message_conversation_members mcm ON mcm.conversation_id = m.conversation_id
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE m.id = message_attachments.message_id
        AND ur.auth_user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Members can insert attachments"
  ON message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = message_attachments.uploaded_by OR ur.role = 'super_admin')
    )
  );

CREATE POLICY "Authors can delete their attachments"
  ON message_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = message_attachments.uploaded_by OR ur.role = 'super_admin')
    )
  );
