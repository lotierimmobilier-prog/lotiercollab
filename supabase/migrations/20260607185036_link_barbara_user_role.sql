INSERT INTO user_roles (auth_user_id, role, member_id)
VALUES ('396794ec-9363-4181-bbe9-809fa94afbe4', 'agent', '0805213c-d551-4a41-b2cd-7407e5f5451d')
ON CONFLICT (auth_user_id) DO UPDATE SET role = 'agent', member_id = '0805213c-d551-4a41-b2cd-7407e5f5451d';