INSERT INTO projects (name, color, is_private, owner_auth_user_id, sort_order)
SELECT
  'Privé',
  '#6B7280',
  true,
  u.auth_user_id,
  999
FROM (VALUES
  ('396794ec-9363-4181-bbe9-809fa94afbe4'::uuid),
  ('3ab423f9-0726-460d-9d54-98e3125a8578'::uuid),
  ('f6f48247-6ec4-47dc-aa8d-ee0facb5bbcf'::uuid),
  ('8bcd7732-7d9d-4fcc-8891-0062bf7ee0d6'::uuid)
) AS u(auth_user_id)
WHERE NOT EXISTS (
  SELECT 1 FROM projects p
  WHERE p.owner_auth_user_id = u.auth_user_id
    AND p.is_private = true
    AND p.name = 'Privé'
);