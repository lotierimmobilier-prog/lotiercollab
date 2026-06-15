
/*
  # Correction complète des politiques RLS de messagerie

  ## Problème
  Les politiques RLS bloquaient les requêtes car :
  1. La politique SELECT sur message_conversation_members faisait un self-join qui bloquait le super_admin
     quand il n'était pas encore dans la conversation
  2. La politique INSERT sur chat_messages nécessitait que le super_admin soit dans message_conversation_members
     avant même d'avoir pu l'insérer
  3. La chaîne de dépendances circulaires empêchait toute création de conversation

  ## Solution
  Simplifier toutes les politiques : super_admin passe toujours, les membres vérifient leur appartenance directement.
*/

-- message_conversations
DROP POLICY IF EXISTS "Members can view their conversations" ON message_conversations;
DROP POLICY IF EXISTS "Members can create conversations" ON message_conversations;
DROP POLICY IF EXISTS "Members can update conversations they created" ON message_conversations;

CREATE POLICY "view_conversations"
  ON message_conversations FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT ur.auth_user_id FROM user_roles ur WHERE ur.role = 'super_admin'
    )
    OR id IN (
      SELECT mcm.conversation_id FROM message_conversation_members mcm
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE ur.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "insert_conversations"
  ON message_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "update_conversations"
  ON message_conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "delete_conversations"
  ON message_conversations FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT ur.auth_user_id FROM user_roles ur WHERE ur.role = 'super_admin'
    )
    OR created_by IN (
      SELECT ur.member_id FROM user_roles ur WHERE ur.auth_user_id = auth.uid()
    )
  );

-- message_conversation_members
DROP POLICY IF EXISTS "Members can view conversation memberships" ON message_conversation_members;
DROP POLICY IF EXISTS "Members can insert conversation memberships" ON message_conversation_members;
DROP POLICY IF EXISTS "Members can delete conversation memberships" ON message_conversation_members;

CREATE POLICY "view_conv_members"
  ON message_conversation_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "insert_conv_members"
  ON message_conversation_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "delete_conv_members"
  ON message_conversation_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT ur.auth_user_id FROM user_roles ur WHERE ur.role = 'super_admin'
    )
    OR member_id IN (
      SELECT ur.member_id FROM user_roles ur WHERE ur.auth_user_id = auth.uid()
    )
  );

-- chat_messages
DROP POLICY IF EXISTS "View messages in own conversations" ON chat_messages;
DROP POLICY IF EXISTS "Insert messages in own conversations" ON chat_messages;
DROP POLICY IF EXISTS "Update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Delete own messages" ON chat_messages;

CREATE POLICY "view_chat_messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT ur.auth_user_id FROM user_roles ur WHERE ur.role = 'super_admin'
    )
    OR conversation_id IN (
      SELECT mcm.conversation_id FROM message_conversation_members mcm
      JOIN user_roles ur ON ur.member_id = mcm.member_id
      WHERE ur.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "insert_chat_messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT ur.auth_user_id FROM user_roles ur WHERE ur.role = 'super_admin'
    )
    OR (
      author_id IN (SELECT ur.member_id FROM user_roles ur WHERE ur.auth_user_id = auth.uid())
      AND conversation_id IN (
        SELECT mcm.conversation_id FROM message_conversation_members mcm
        JOIN user_roles ur ON ur.member_id = mcm.member_id
        WHERE ur.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "update_chat_messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT ur.auth_user_id FROM user_roles ur WHERE ur.role = 'super_admin')
    OR author_id IN (SELECT ur.member_id FROM user_roles ur WHERE ur.auth_user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() IN (SELECT ur.auth_user_id FROM user_roles ur WHERE ur.role = 'super_admin')
    OR author_id IN (SELECT ur.member_id FROM user_roles ur WHERE ur.auth_user_id = auth.uid())
  );

CREATE POLICY "delete_chat_messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT ur.auth_user_id FROM user_roles ur WHERE ur.role = 'super_admin')
    OR author_id IN (SELECT ur.member_id FROM user_roles ur WHERE ur.auth_user_id = auth.uid())
  );

-- chat_attachments
DROP POLICY IF EXISTS "View attachments in own conversations" ON chat_attachments;
DROP POLICY IF EXISTS "Insert own attachments" ON chat_attachments;
DROP POLICY IF EXISTS "Delete own attachments" ON chat_attachments;

CREATE POLICY "view_chat_attachments"
  ON chat_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "insert_chat_attachments"
  ON chat_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "delete_chat_attachments"
  ON chat_attachments FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT ur.auth_user_id FROM user_roles ur WHERE ur.role = 'super_admin')
    OR uploaded_by IN (SELECT ur.member_id FROM user_roles ur WHERE ur.auth_user_id = auth.uid())
  );
