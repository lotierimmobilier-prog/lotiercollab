/*
  # Google Calendar Integration

  1. New Tables
    - `google_calendar_tokens`
      - `id` (uuid, primary key)
      - `member_id` (uuid, FK → members) - one token set per member
      - `access_token` (text) - OAuth2 access token
      - `refresh_token` (text) - OAuth2 refresh token (long-lived)
      - `expires_at` (timestamptz) - when access token expires
      - `calendar_id` (text) - selected Google Calendar ID (default 'primary')
      - `sync_enabled` (boolean) - whether sync is active for this member
      - `last_synced_at` (timestamptz) - last successful sync timestamp
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - super_admin can read/write all tokens
    - Each member can only read/update their own token via member_id lookup

  3. Notes
    - Tokens are stored as plain text; in production consider pgcrypto encryption
    - `sync_enabled` allows members to pause sync without revoking OAuth
*/

CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  calendar_id text NOT NULL DEFAULT 'primary',
  sync_enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id)
);

ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- super_admin can manage all tokens
CREATE POLICY "Super admin can read all calendar tokens"
  ON google_calendar_tokens FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can insert calendar tokens"
  ON google_calendar_tokens FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can update calendar tokens"
  ON google_calendar_tokens FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can delete calendar tokens"
  ON google_calendar_tokens FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Each agent can read/update their own token
CREATE POLICY "Agent can read own calendar token"
  ON google_calendar_tokens FOR SELECT
  TO authenticated
  USING (
    member_id = (
      SELECT member_id FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Agent can insert own calendar token"
  ON google_calendar_tokens FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id = (
      SELECT member_id FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY "Agent can update own calendar token"
  ON google_calendar_tokens FOR UPDATE
  TO authenticated
  USING (
    member_id = (
      SELECT member_id FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    member_id = (
      SELECT member_id FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- Index for fast member lookups
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_member_id
  ON google_calendar_tokens(member_id);
