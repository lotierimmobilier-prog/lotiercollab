/*
  # Force reset Tristan password - v2

  Hard reset of password + update identity_data to ensure email match
*/

UPDATE auth.users
SET 
  encrypted_password = crypt('terpereau2026', gen_salt('bf', 10)),
  updated_at = now(),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
WHERE email = 'tristan@lotier-immobilier.com';

UPDATE auth.identities
SET
  identity_data = '{"sub":"8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6","email":"tristan@lotier-immobilier.com","email_verified":true}'::jsonb,
  updated_at = now()
WHERE user_id = '8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6';
