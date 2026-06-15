/*
  # Fix Tristan user_roles member_id link

  ## Problem
  Tristan's user_roles entry has member_id = NULL, which prevents RLS policies
  from finding his conversations and messages. The policy `view_chat_messages`
  checks via `user_roles.member_id`, so without this link nothing is visible.

  ## Fix
  Set member_id for Tristan's user_roles entry to his correct member record.
*/

UPDATE user_roles
SET member_id = 'de3a70be-62c0-4adb-b981-ea805d01bc6a'
WHERE auth_user_id = '8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6'
  AND member_id IS NULL;
