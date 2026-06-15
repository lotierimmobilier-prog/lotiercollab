/*
  # Create calendar_events table for free appointments

  1. New Tables
    - `calendar_events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `start_date` (date, required) - event start date
      - `end_date` (date, optional) - event end date (for multi-day events)
      - `start_time` (time, optional) - start time for timed events
      - `end_time` (time, optional) - end time for timed events
      - `all_day` (boolean) - whether event spans full day
      - `color` (text) - display color hex
      - `member_id` (uuid, FK members) - owner/assigned member
      - `created_by` (uuid, FK members) - who created it
      - `google_event_id` (text, optional) - linked Google Calendar event ID
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - super_admin can manage all events
    - agents can read all events, manage their own
*/

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  start_date date NOT NULL,
  end_date date,
  start_time time,
  end_time time,
  all_day boolean NOT NULL DEFAULT true,
  color text NOT NULL DEFAULT '#1A3A5C',
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  google_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all calendar events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert calendar events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Super admin or creator can update calendar events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      AND (user_roles.role = 'super_admin'
        OR user_roles.member_id = calendar_events.created_by)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      AND (user_roles.role = 'super_admin'
        OR user_roles.member_id = calendar_events.created_by)
    )
  );

CREATE POLICY "Super admin or creator can delete calendar events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
      AND (user_roles.role = 'super_admin'
        OR user_roles.member_id = calendar_events.created_by)
    )
  );

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_member_id ON calendar_events(member_id);
