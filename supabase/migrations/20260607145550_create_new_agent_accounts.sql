
DO $$
DECLARE
  v_id uuid;
  v_member_id uuid;
BEGIN

  -- Barbara BOUBA
  SELECT id INTO v_id FROM auth.users WHERE email = 'barbara.bouba@lotier-immobilier.com';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'barbara.bouba@lotier-immobilier.com', crypt('Lotier2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now());
  END IF;
  INSERT INTO members (full_name, email, initials, avatar_color, role)
  SELECT 'Barbara BOUBA', 'barbara.bouba@lotier-immobilier.com', 'BB', '#E67E22', 'agent'
  WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'barbara.bouba@lotier-immobilier.com')
  RETURNING id INTO v_member_id;
  IF v_member_id IS NULL THEN SELECT id INTO v_member_id FROM members WHERE email = 'barbara.bouba@lotier-immobilier.com'; END IF;
  INSERT INTO user_roles (auth_user_id, member_id, role) SELECT v_id, v_member_id, 'agent' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = v_id);

  -- Laetitia Dias
  SELECT id INTO v_id FROM auth.users WHERE email = 'laetitia.dias@lotier-immobilier.com';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'laetitia.dias@lotier-immobilier.com', crypt('Lotier2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now());
  END IF;
  INSERT INTO members (full_name, email, initials, avatar_color, role)
  SELECT 'Laetitia Dias', 'laetitia.dias@lotier-immobilier.com', 'LD', '#2980B9', 'agent'
  WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'laetitia.dias@lotier-immobilier.com')
  RETURNING id INTO v_member_id;
  IF v_member_id IS NULL THEN SELECT id INTO v_member_id FROM members WHERE email = 'laetitia.dias@lotier-immobilier.com'; END IF;
  INSERT INTO user_roles (auth_user_id, member_id, role) SELECT v_id, v_member_id, 'agent' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = v_id);

  -- Aubin MARCHI
  SELECT id INTO v_id FROM auth.users WHERE email = 'aubin.marchi@lotier-immobilier.com';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'aubin.marchi@lotier-immobilier.com', crypt('Lotier2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now());
  END IF;
  INSERT INTO members (full_name, email, initials, avatar_color, role)
  SELECT 'Aubin MARCHI', 'aubin.marchi@lotier-immobilier.com', 'AM', '#27AE60', 'agent'
  WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'aubin.marchi@lotier-immobilier.com')
  RETURNING id INTO v_member_id;
  IF v_member_id IS NULL THEN SELECT id INTO v_member_id FROM members WHERE email = 'aubin.marchi@lotier-immobilier.com'; END IF;
  INSERT INTO user_roles (auth_user_id, member_id, role) SELECT v_id, v_member_id, 'agent' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = v_id);

  -- Elodie CHARDOT
  SELECT id INTO v_id FROM auth.users WHERE email = 'elodie.chardot@lotier-immobilier.com';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'elodie.chardot@lotier-immobilier.com', crypt('Lotier2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now());
  END IF;
  INSERT INTO members (full_name, email, initials, avatar_color, role)
  SELECT 'Elodie CHARDOT', 'elodie.chardot@lotier-immobilier.com', 'EC', '#8E44AD', 'agent'
  WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'elodie.chardot@lotier-immobilier.com')
  RETURNING id INTO v_member_id;
  IF v_member_id IS NULL THEN SELECT id INTO v_member_id FROM members WHERE email = 'elodie.chardot@lotier-immobilier.com'; END IF;
  INSERT INTO user_roles (auth_user_id, member_id, role) SELECT v_id, v_member_id, 'agent' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = v_id);

  -- Céline AUBIN
  SELECT id INTO v_id FROM auth.users WHERE email = 'celine.aubin@lotier-immobilier.com';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'celine.aubin@lotier-immobilier.com', crypt('Lotier2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now());
  END IF;
  INSERT INTO members (full_name, email, initials, avatar_color, role)
  SELECT 'Céline AUBIN', 'celine.aubin@lotier-immobilier.com', 'CA', '#16A085', 'agent'
  WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'celine.aubin@lotier-immobilier.com')
  RETURNING id INTO v_member_id;
  IF v_member_id IS NULL THEN SELECT id INTO v_member_id FROM members WHERE email = 'celine.aubin@lotier-immobilier.com'; END IF;
  INSERT INTO user_roles (auth_user_id, member_id, role) SELECT v_id, v_member_id, 'agent' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = v_id);

  -- Fabienne RUBI
  SELECT id INTO v_id FROM auth.users WHERE email = 'fabienne.rubi@lotier-immobilier.com';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'fabienne.rubi@lotier-immobilier.com', crypt('Lotier2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now());
  END IF;
  INSERT INTO members (full_name, email, initials, avatar_color, role)
  SELECT 'Fabienne RUBI', 'fabienne.rubi@lotier-immobilier.com', 'FR', '#C0392B', 'agent'
  WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'fabienne.rubi@lotier-immobilier.com')
  RETURNING id INTO v_member_id;
  IF v_member_id IS NULL THEN SELECT id INTO v_member_id FROM members WHERE email = 'fabienne.rubi@lotier-immobilier.com'; END IF;
  INSERT INTO user_roles (auth_user_id, member_id, role) SELECT v_id, v_member_id, 'agent' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = v_id);

  -- Philippe LEGER
  SELECT id INTO v_id FROM auth.users WHERE email = 'philippe.leger@lotier-immobilier.com';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'philippe.leger@lotier-immobilier.com', crypt('Lotier2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now());
  END IF;
  INSERT INTO members (full_name, email, initials, avatar_color, role)
  SELECT 'Philippe LEGER', 'philippe.leger@lotier-immobilier.com', 'PL', '#1A5276', 'agent'
  WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'philippe.leger@lotier-immobilier.com')
  RETURNING id INTO v_member_id;
  IF v_member_id IS NULL THEN SELECT id INTO v_member_id FROM members WHERE email = 'philippe.leger@lotier-immobilier.com'; END IF;
  INSERT INTO user_roles (auth_user_id, member_id, role) SELECT v_id, v_member_id, 'agent' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = v_id);

  -- Frédérique GALLUCCI
  SELECT id INTO v_id FROM auth.users WHERE email = 'frederique.gallucci@lotier-immobilier.com';
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', 'frederique.gallucci@lotier-immobilier.com', crypt('Lotier2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', now(), now());
  END IF;
  INSERT INTO members (full_name, email, initials, avatar_color, role)
  SELECT 'Frédérique GALLUCCI', 'frederique.gallucci@lotier-immobilier.com', 'FG', '#7D6608', 'agent'
  WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'frederique.gallucci@lotier-immobilier.com')
  RETURNING id INTO v_member_id;
  IF v_member_id IS NULL THEN SELECT id INTO v_member_id FROM members WHERE email = 'frederique.gallucci@lotier-immobilier.com'; END IF;
  INSERT INTO user_roles (auth_user_id, member_id, role) SELECT v_id, v_member_id, 'agent' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE auth_user_id = v_id);

END $$;
