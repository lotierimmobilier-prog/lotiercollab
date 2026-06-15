-- Créer un projet privé de départ pour Stéphanie LEGROS
-- auth_user_id = f6f48247-6ec4-47dc-aa8d-ee0facb5bbcf
INSERT INTO projects (name, color, parent_id, sort_order, is_private, owner_auth_user_id)
VALUES ('Mon espace privé', '#3B82F6', null, 1000, true, 'f6f48247-6ec4-47dc-aa8d-ee0facb5bbcf')
ON CONFLICT DO NOTHING;
