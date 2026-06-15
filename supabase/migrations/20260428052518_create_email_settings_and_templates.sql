/*
  # Email settings and templates

  ## Purpose
  Stores SMTP configuration and per-event email templates for the admin
  to customize notification emails sent to users.

  ## New Tables

  ### email_settings
  Singleton row (only one config). Stores SMTP credentials.
  - id (uuid)
  - smtp_host (text)
  - smtp_port (int)
  - smtp_secure (bool) — true = SSL/TLS
  - smtp_user (text) — sending email address
  - smtp_password (text) — SMTP password (stored encrypted at rest by Supabase)
  - smtp_from_name (text) — display name for From field
  - enabled (bool) — master toggle
  - created_at / updated_at

  ### email_templates
  One row per event type. Admin can customize subject + body with placeholders.
  - id (uuid)
  - event_type (text, unique) — e.g. 'task_assigned', 'comment_added', 'memo_due', 'new_message'
  - enabled (bool) — toggle per event
  - subject (text) — supports {{placeholders}}
  - body_html (text) — full HTML template with {{placeholders}}
  - created_at / updated_at

  ## Security
  - RLS enabled on both tables
  - Only super admins can read/write
*/

CREATE TABLE IF NOT EXISTS email_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host     text NOT NULL DEFAULT 'ssl0.ovh.net',
  smtp_port     int  NOT NULL DEFAULT 993,
  smtp_secure   bool NOT NULL DEFAULT true,
  smtp_user     text NOT NULL DEFAULT '',
  smtp_password text NOT NULL DEFAULT '',
  smtp_from_name text NOT NULL DEFAULT 'Lotier Collab',
  enabled       bool NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Ensure only one row ever exists
CREATE UNIQUE INDEX IF NOT EXISTS email_settings_singleton ON email_settings ((true));

ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read email settings"
  ON email_settings FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.auth_user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

CREATE POLICY "Super admins can insert email settings"
  ON email_settings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.auth_user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

CREATE POLICY "Super admins can update email settings"
  ON email_settings FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.auth_user_id = auth.uid() AND user_roles.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.auth_user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text UNIQUE NOT NULL,
  enabled     bool NOT NULL DEFAULT true,
  subject     text NOT NULL DEFAULT '',
  body_html   text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read email templates"
  ON email_templates FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.auth_user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

CREATE POLICY "Super admins can insert email templates"
  ON email_templates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.auth_user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

CREATE POLICY "Super admins can update email templates"
  ON email_templates FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.auth_user_id = auth.uid() AND user_roles.role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.auth_user_id = auth.uid() AND user_roles.role = 'super_admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed default templates
INSERT INTO email_templates (event_type, enabled, subject, body_html) VALUES

('task_assigned',
 true,
 'Nouvelle tâche assignée : {{task_title}}',
 '<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
<div style="border-left:4px solid #1A3A5C;padding-left:16px;margin-bottom:24px">
  <h2 style="margin:0;color:#1A3A5C">Nouvelle tâche assignée</h2>
</div>
<p>Bonjour <strong>{{recipient_name}}</strong>,</p>
<p>Une tâche vous a été assignée par <strong>{{actor_name}}</strong> :</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0">
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa;width:140px">Tâche</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">{{task_title}}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa">Projet</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">{{project_name}}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa">Priorité</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">{{priority}}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa">Échéance</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">{{due_date}}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa">Description</td><td style="padding:8px">{{description}}</td></tr>
</table>
<p><a href="{{app_url}}" style="display:inline-block;background:#1A3A5C;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Voir la tâche</a></p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<p style="font-size:12px;color:#9ca3af">Lotier Collab — notification automatique</p>
</body></html>'),

('task_updated',
 true,
 'Tâche mise à jour : {{task_title}}',
 '<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
<div style="border-left:4px solid #0891B2;padding-left:16px;margin-bottom:24px">
  <h2 style="margin:0;color:#0891B2">Tâche mise à jour</h2>
</div>
<p>Bonjour <strong>{{recipient_name}}</strong>,</p>
<p>La tâche <strong>{{task_title}}</strong> a été modifiée par <strong>{{actor_name}}</strong>.</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0">
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa;width:140px">Nouveau statut</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">{{new_status}}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa">Projet</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">{{project_name}}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa">Modification</td><td style="padding:8px">{{change_summary}}</td></tr>
</table>
<p><a href="{{app_url}}" style="display:inline-block;background:#0891B2;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Voir la tâche</a></p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<p style="font-size:12px;color:#9ca3af">Lotier Collab — notification automatique</p>
</body></html>'),

('comment_added',
 true,
 'Nouveau commentaire sur : {{task_title}}',
 '<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
<div style="border-left:4px solid #059669;padding-left:16px;margin-bottom:24px">
  <h2 style="margin:0;color:#059669">Nouveau commentaire</h2>
</div>
<p>Bonjour <strong>{{recipient_name}}</strong>,</p>
<p><strong>{{actor_name}}</strong> a commenté la tâche <strong>{{task_title}}</strong> :</p>
<blockquote style="border-left:3px solid #e5e7eb;margin:16px 0;padding:12px 16px;background:#f9fafb;border-radius:4px;font-style:italic">
  "{{comment_body}}"
</blockquote>
<table style="border-collapse:collapse;width:100%;margin:16px 0">
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa;width:140px">Projet</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">{{project_name}}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa">Date</td><td style="padding:8px">{{comment_date}}</td></tr>
</table>
<p><a href="{{app_url}}" style="display:inline-block;background:#059669;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Voir le commentaire</a></p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<p style="font-size:12px;color:#9ca3af">Lotier Collab — notification automatique</p>
</body></html>'),

('new_message',
 true,
 'Nouveau message de {{actor_name}} : {{conversation_title}}',
 '<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
<div style="border-left:4px solid #D97706;padding-left:16px;margin-bottom:24px">
  <h2 style="margin:0;color:#D97706">Nouveau message</h2>
</div>
<p>Bonjour <strong>{{recipient_name}}</strong>,</p>
<p><strong>{{actor_name}}</strong> vous a envoyé un message dans la conversation <strong>{{conversation_title}}</strong> :</p>
<blockquote style="border-left:3px solid #e5e7eb;margin:16px 0;padding:12px 16px;background:#f9fafb;border-radius:4px">
  {{message_preview}}
</blockquote>
<p><em style="font-size:12px;color:#9ca3af">{{unread_count}} message(s) non lu(s) dans cette conversation</em></p>
<p><a href="{{app_url}}" style="display:inline-block;background:#D97706;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Répondre</a></p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<p style="font-size:12px;color:#9ca3af">Lotier Collab — notification automatique</p>
</body></html>'),

('memo_due',
 true,
 'Mémo arrivant à échéance : {{memo_title}}',
 '<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
<div style="border-left:4px solid #DC2626;padding-left:16px;margin-bottom:24px">
  <h2 style="margin:0;color:#DC2626">Mémo arrivant à échéance</h2>
</div>
<p>Bonjour <strong>{{recipient_name}}</strong>,</p>
<p>Votre mémo <strong>{{memo_title}}</strong> arrive à échéance {{due_label}} :</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0">
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa;width:140px">Titre</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">{{memo_title}}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa">Échéance</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">{{due_date}}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa">Priorité</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">{{priority}}</td></tr>
  <tr><td style="padding:8px;font-weight:bold;background:#f8f9fa">Contenu</td><td style="padding:8px">{{memo_body}}</td></tr>
</table>
<p><a href="{{app_url}}" style="display:inline-block;background:#DC2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Voir le mémo</a></p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<p style="font-size:12px;color:#9ca3af">Lotier Collab — notification automatique</p>
</body></html>')

ON CONFLICT (event_type) DO NOTHING;
