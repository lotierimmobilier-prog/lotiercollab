/*
  # Supprimer le compte auth corrompu de Stéphanie

  Suppression propre de l'identité et du compte auth de stephanie.legros@lotier-immobilier.com
  afin de le recréer via l'API Admin avec un mot de passe valide.
*/

DELETE FROM auth.identities WHERE user_id = '519ab008-8236-4b0f-b3aa-73968098c47e';
DELETE FROM auth.sessions WHERE user_id = '519ab008-8236-4b0f-b3aa-73968098c47e';
DELETE FROM auth.refresh_tokens WHERE user_id = '519ab008-8236-4b0f-b3aa-73968098c47e';
DELETE FROM auth.users WHERE id = '519ab008-8236-4b0f-b3aa-73968098c47e';
