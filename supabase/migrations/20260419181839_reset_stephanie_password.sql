/*
  # Reset password for stephanie.legros@lotier-immobilier.com

  Sets a fresh bcrypt hash for the password "legros2026" and ensures
  the account is fully confirmed and active.
*/

UPDATE auth.users
SET
  encrypted_password = crypt('legros2026', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now(),
  banned_until = NULL
WHERE email = 'stephanie.legros@lotier-immobilier.com';
