
/*
  # Fix Tristan identity - clean rebuild

  Delete and recreate the auth identity for tristan@lotier-immobilier.com
  to resolve the "Database error querying schema" Supabase Auth error.
  Also ensures the user record has all required fields set correctly.
*/

-- Delete existing identity
DELETE FROM auth.identities
WHERE user_id = '8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6';

-- Recreate identity with correct structure
INSERT INTO auth.identities (
  id,
  user_id,
  provider,
  identity_data,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6',
  '8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6',
  'email',
  jsonb_build_object(
    'sub', '8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6',
    'email', 'tristan@lotier-immobilier.com',
    'email_verified', true,
    'phone_verified', false
  ),
  'tristan@lotier-immobilier.com',
  now(),
  now(),
  now()
);

-- Ensure user record is complete
UPDATE auth.users SET
  encrypted_password = crypt('terpereau2026', gen_salt('bf', 10)),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmation_token = '',
  recovery_token = '',
  aud = 'authenticated',
  role = 'authenticated',
  updated_at = now()
WHERE id = '8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6';
