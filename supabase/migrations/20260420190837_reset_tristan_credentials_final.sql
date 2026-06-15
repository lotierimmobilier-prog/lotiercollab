
/*
  # Reset Tristan credentials

  Ensures password and identity are correctly set for tristan@lotier-immobilier.com
*/

UPDATE auth.users
SET 
  encrypted_password = crypt('terpereau2026', gen_salt('bf', 10)),
  updated_at = now(),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
WHERE email = 'tristan@lotier-immobilier.com';

UPDATE auth.identities
SET
  identity_data = jsonb_build_object(
    'sub', user_id::text,
    'email', 'tristan@lotier-immobilier.com',
    'email_verified', true
  ),
  updated_at = now()
WHERE user_id = '8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6';
