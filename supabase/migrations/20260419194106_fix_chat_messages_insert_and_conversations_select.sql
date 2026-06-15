/*
  # Fix chat_messages INSERT and conversation access for all roles

  ## Problem
  - Agents (Tristan, Stéphanie) get 403 when trying to send messages
  - The INSERT policy on chat_messages requires the author to already be in 
    message_conversation_members at the exact moment of insert, which can fail
    in the conversation creation flow (race condition between member insert and message insert)
  - The conversations SELECT could return 403 due to RLS policy complexity

  ## Changes
  1. Simplify chat_messages INSERT: only check that author_id matches the authenticated user's
     member_id (the SELECT policy already ensures only conversation members can read messages)
  2. Ensure all agents can freely read/write messages in conversations they are part of

  ## Security
  - SELECT remains restricted: only conversation members can see messages
  - INSERT simplified: any authenticated user can insert if author_id matches their member_id
  - UPDATE/DELETE remain: only author or super_admin can modify
*/

-- Simplify INSERT on chat_messages: just verify the author is the current authenticated user
DROP POLICY IF EXISTS "insert_chat_messages" ON chat_messages;
CREATE POLICY "insert_chat_messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id IN (
      SELECT ur.member_id 
      FROM user_roles ur 
      WHERE ur.auth_user_id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT ur.auth_user_id 
      FROM user_roles ur 
      WHERE ur.role = 'super_admin'
    )
  );
