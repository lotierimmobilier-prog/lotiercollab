
/*
  # Relink Tristan user_role after user recreation

  The auth user was recreated via Admin API with the same UUID.
  This ensures the user_roles entry exists and is linked correctly.
*/

INSERT INTO user_roles (auth_user_id, role, member_id)
VALUES (
  '8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6',
  'agent',
  'de3a70be-62c0-4adb-b981-ea805d01bc6a'
)
ON CONFLICT (auth_user_id) DO UPDATE SET
  role = 'agent',
  member_id = 'de3a70be-62c0-4adb-b981-ea805d01bc6a';
