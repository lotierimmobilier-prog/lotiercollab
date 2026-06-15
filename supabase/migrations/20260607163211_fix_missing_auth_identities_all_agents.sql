
-- Créer les identities manquantes pour tous les utilisateurs auth sans identity
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  u.email,
  'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(),
  now(),
  now()
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
WHERE i.user_id IS NULL
ON CONFLICT DO NOTHING;
