
/*
  # Create user_preferences table

  Stores per-user UI preferences, starting with sidebar theme choice.

  1. New Tables
    - `user_preferences`
      - `auth_user_id` (uuid, PK, FK → auth.users)
      - `sidebar_theme` (text, 'dark' | 'light', default 'dark')
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - Users can only read and write their own preferences
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sidebar_theme text NOT NULL DEFAULT 'dark' CHECK (sidebar_theme IN ('dark', 'light')),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);
