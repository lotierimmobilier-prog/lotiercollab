/*
  # Reset Tristan password to terpereau2026

  Sets a fresh bcrypt hash for tristan@lotier-immobilier.com
  with password: terpereau2026
*/

UPDATE auth.users
SET 
  encrypted_password = crypt('terpereau2026', gen_salt('bf')),
  updated_at = now()
WHERE email = 'tristan@lotier-immobilier.com';
