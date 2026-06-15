/*
  # Lier le nouveau compte auth de Stéphanie à son rôle

  Création de l'entrée user_roles pour le nouveau auth user de stephanie.legros@lotier-immobilier.com
  avec son member_id existant et le rôle agent.
*/

INSERT INTO public.user_roles (auth_user_id, role, member_id)
VALUES (
  'f6f48247-6ec4-47dc-aa8d-ee0facb5bbcf',
  'agent',
  'ece3e4fc-1260-4fe5-8638-f4a6ecd692e5'
)
ON CONFLICT (auth_user_id) DO UPDATE
  SET role = 'agent',
      member_id = 'ece3e4fc-1260-4fe5-8638-f4a6ecd692e5';
