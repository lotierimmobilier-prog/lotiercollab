/*
  # Create auth accounts for Stéphanie Legros and Tristan Terpereau

  Creates Supabase auth users with the provided credentials and links them
  to existing member records via user_roles.
  
  - stephanie.legros@lotier-immobilier.com / legros2026
  - tristan@lotier-immobilier.com / terpereau2026
  
  Both are given the 'agent' role.
*/

DO $$
DECLARE
  stephanie_auth_id uuid;
  tristan_auth_id uuid;
BEGIN
  -- Create Stéphanie Legros auth account if not exists
  SELECT id INTO stephanie_auth_id FROM auth.users WHERE email = 'stephanie.legros@lotier-immobilier.com';
  IF stephanie_auth_id IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'stephanie.legros@lotier-immobilier.com',
      crypt('legros2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated',
      now(),
      now()
    )
    RETURNING id INTO stephanie_auth_id;

    INSERT INTO user_roles (auth_user_id, member_id, role)
    VALUES (stephanie_auth_id, '934d42ad-d705-4d6f-acfc-6bbf53873b48', 'agent');
  END IF;

  -- Create Tristan auth account if not exists
  SELECT id INTO tristan_auth_id FROM auth.users WHERE email = 'tristan@lotier-immobilier.com';
  IF tristan_auth_id IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'tristan@lotier-immobilier.com',
      crypt('terpereau2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated',
      now(),
      now()
    )
    RETURNING id INTO tristan_auth_id;

    INSERT INTO user_roles (auth_user_id, member_id, role)
    VALUES (tristan_auth_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'agent');
  END IF;

  -- Update passwords if accounts already existed (for re-runs)
  UPDATE auth.users SET encrypted_password = crypt('legros2026', gen_salt('bf')), updated_at = now()
  WHERE email = 'stephanie.legros@lotier-immobilier.com';

  UPDATE auth.users SET encrypted_password = crypt('terpereau2026', gen_salt('bf')), updated_at = now()
  WHERE email = 'tristan@lotier-immobilier.com';
END $$;
