
/*
  # Renommage des tables messages → chat_messages et message_attachments → chat_attachments

  ## Raison
  La table `messages` entre en conflit avec `realtime.messages` (table interne Supabase).
  Ce conflit cause des erreurs 500 sur toutes les requêtes PostgREST impliquant cette table.

  ## Changements
  - `public.messages` → `public.chat_messages`
  - `public.message_attachments` → `public.chat_attachments`
  - Toutes les FK, contraintes et politiques RLS sont recrées avec les nouveaux noms.
*/

DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
  author_id uuid REFERENCES members(id) ON DELETE SET NULL,
  body text NOT NULL DEFAULT '',
  reply_to_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  cited_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  cited_task_title text,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  file_size bigint DEFAULT 0,
  uploaded_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages in own conversations"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_conversation_members mcm
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE mcm.conversation_id = chat_messages.conversation_id
        AND ur.auth_user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Insert messages in own conversations"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_conversation_members mcm
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE mcm.conversation_id = chat_messages.conversation_id
        AND ur.auth_user_id = auth.uid()
        AND ur.member_id = chat_messages.author_id
    ) OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Update own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = chat_messages.author_id OR ur.role = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = chat_messages.author_id OR ur.role = 'super_admin')
    )
  );

CREATE POLICY "Delete own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = chat_messages.author_id OR ur.role = 'super_admin')
    )
  );

CREATE POLICY "View attachments in own conversations"
  ON chat_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages m
      JOIN message_conversation_members mcm ON mcm.conversation_id = m.conversation_id
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE m.id = chat_attachments.message_id
        AND ur.auth_user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Insert own attachments"
  ON chat_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = chat_attachments.uploaded_by OR ur.role = 'super_admin')
    )
  );

CREATE POLICY "Delete own attachments"
  ON chat_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = chat_attachments.uploaded_by OR ur.role = 'super_admin')
    )
  );
