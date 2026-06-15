
UPDATE auth.users
SET is_super_admin = false
WHERE is_super_admin IS NULL;
