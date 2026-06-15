/*
  # Add soft delete to chat_messages

  1. Changes
    - Add `deleted_at` column (timestamptz, nullable) to `chat_messages`
    - When a message is deleted, we set `deleted_at` instead of removing the row
    - This allows displaying "Message supprimé" in the UI
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;
