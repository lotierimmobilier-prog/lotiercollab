/*
  # Système de messagerie interne

  1. Nouvelles tables
    - `message_conversations`
      - `id` (uuid, PK)
      - `title` (text) - nom du fil / thème
      - `created_by` (uuid -> members)
      - `created_at`, `updated_at`

    - `message_conversation_members`
      - `conversation_id` (uuid -> message_conversations)
      - `member_id` (uuid -> members)
      - `joined_at`

    - `messages`
      - `id` (uuid, PK)
      - `conversation_id` (uuid -> message_conversations)
      - `author_id` (uuid -> members)
      - `body` (text)
      - `reply_to_id` (uuid -> messages, nullable) - citation d'un message
      - `cited_task_id` (uuid -> tasks, nullable) - tâche citée
      - `cited_task_step` (text, nullable) - étape/sous-tâche citée
      - `created_at`
      - `edited_at` (nullable)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Les membres peuvent voir uniquement les conversations auxquelles ils participent
    - Seuls les auteurs peuvent modifier leurs messages
    - Les super_admins voient tout
*/

CREATE TABLE IF NOT EXISTS message_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_conversation_members (
  conversation_id uuid REFERENCES message_conversations(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, member_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES message_conversations(id) ON DELETE CASCADE,
  author_id uuid REFERENCES members(id) ON DELETE SET NULL,
  body text NOT NULL DEFAULT '',
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  cited_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  cited_task_title text,
  created_at timestamptz DEFAULT now(),
  edited_at timestamptz
);

ALTER TABLE message_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their conversations"
  ON message_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_conversation_members mcm
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE mcm.conversation_id = message_conversations.id
        AND ur.auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Members can create conversations"
  ON message_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN members m ON m.id = ur.member_id
      WHERE ur.auth_user_id = auth.uid() AND ur.member_id = message_conversations.created_by
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Members can update conversations they created"
  ON message_conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = message_conversations.created_by OR ur.role = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = message_conversations.created_by OR ur.role = 'super_admin')
    )
  );

CREATE POLICY "Members can view conversation memberships"
  ON message_conversation_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_conversation_members mcm2
      JOIN user_roles ur ON ur.member_id = mcm2.member_id
      WHERE mcm2.conversation_id = message_conversation_members.conversation_id
        AND ur.auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Members can insert conversation memberships"
  ON message_conversation_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete conversation memberships"
  ON message_conversation_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND (ur.member_id = message_conversation_members.member_id OR ur.role = 'super_admin')
    )
  );

CREATE POLICY "Members can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_conversation_members mcm
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE mcm.conversation_id = messages.conversation_id
        AND ur.auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Members can insert messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_conversation_members mcm
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE mcm.conversation_id = messages.conversation_id
        AND ur.auth_user_id = auth.uid()
        AND ur.member_id = messages.author_id
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.auth_user_id = auth.uid() AND ur.role = 'super_admin'
    )
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

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_mcm_member_id ON message_conversation_members(member_id);
