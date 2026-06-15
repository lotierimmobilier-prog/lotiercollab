/*
  # Fix auth.identities for all manually created users

  Users created by direct INSERT into auth.users are missing entries in auth.identities,
  which causes Supabase to refuse password authentication for them.

  This migration inserts the required identity records for:
  - demo@lotier.fr
  - stephanie.legros@lotier-immobilier.com
  - tristan@lotier-immobilier.com
*/

DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN
    SELECT id, email, encrypted_password
    FROM auth.users
    WHERE email IN (
      'demo@lotier.fr',
      'stephanie.legros@lotier-immobilier.com',
      'tristan@lotier-immobilier.com'
    )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM auth.identities WHERE user_id = u.id AND provider = 'email'
    ) THEN
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
        u.id,
        jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
        'email',
        u.email,
        now(),
        now(),
        now()
      );
    END IF;
  END LOOP;
END $$;
