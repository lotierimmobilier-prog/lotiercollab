
-- Fix NULL token fields that cause GoTrue to fail scanning user records
-- GoTrue's Go struct expects empty strings, not NULL, for these fields
UPDATE auth.users
SET
  confirmation_token   = COALESCE(confirmation_token, ''),
  recovery_token       = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change         = COALESCE(email_change, ''),
  raw_user_meta_data   = CASE
    WHEN raw_user_meta_data = '{}' OR raw_user_meta_data IS NULL
    THEN '{"email_verified": true}'::jsonb
    ELSE raw_user_meta_data
  END
WHERE last_sign_in_at IS NULL
  AND email NOT IN ('stephanie.legros@lotier-immobilier.com', 'tristan@lotier-immobilier.com');
