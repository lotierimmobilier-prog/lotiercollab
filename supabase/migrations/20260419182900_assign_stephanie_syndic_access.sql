/*
  # Accès projet Stéphanie LEGROS

  Restreint Stéphanie LEGROS (member_id = ece3e4fc-1260-4fe5-8638-f4a6ecd692e5)
  au projet "Syndic" (id = 11111111-1111-1111-1111-111111111111) uniquement.
  Les sous-projets de Syndic seront automatiquement visibles grâce à la
  fonction récursive member_can_see_project.
*/

INSERT INTO public.member_project_access (member_id, project_id)
VALUES (
  'ece3e4fc-1260-4fe5-8638-f4a6ecd692e5',
  '11111111-1111-1111-1111-111111111111'
)
ON CONFLICT DO NOTHING;
