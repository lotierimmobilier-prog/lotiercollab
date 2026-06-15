/*
  # Recreate Stephanie auth user with valid bcrypt password

  The user stephanie.legros@lotier-immobilier.com has a corrupted auth state
  due to manual SQL password hash updates. This migration:
  1. Deletes the old auth.identities entry
  2. Deletes the old auth.users entry
  3. Recreates auth.users with the same UUID and a valid bcrypt hash for "legros2026"
  4. Recreates auth.identities for email provider
*/

DELETE FROM auth.identities WHERE user_id = '519ab008-8236-4b0f-b3aa-73968098c47e';

DELETE FROM auth.users WHERE id = '519ab008-8236-4b0f-b3aa-73968098c47e';

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user
) VALUES (
  '519ab008-8236-4b0f-b3aa-73968098c47e',
  '00000000-0000-0000-0000-000000000000',
  'stephanie.legros@lotier-immobilier.com',
  crypt('legros2026', gen_salt('bf', 10)),
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  false
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '519ab008-8236-4b0f-b3aa-73968098c47e',
  jsonb_build_object(
    'sub', '519ab008-8236-4b0f-b3aa-73968098c47e',
    'email', 'stephanie.legros@lotier-immobilier.com',
    'email_verified', true
  ),
  'email',
  'stephanie.legros@lotier-immobilier.com',
  now(),
  now(),
  now()
);
