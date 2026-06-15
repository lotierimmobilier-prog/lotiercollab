/*
  # Add recurrence to projects

  1. Changes
    - `projects` table: add column `default_recurrence` (text, nullable)
      — one of: '15d', '30d', '3m', '6m', '1y'
      — when set, new tasks created in this project inherit this recurrence by default

  2. Notes
    - Nullable; null means no default recurrence for the project
    - Uses IF NOT EXISTS to prevent errors on re-run
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'default_recurrence'
  ) THEN
    ALTER TABLE projects ADD COLUMN default_recurrence text DEFAULT NULL;
  END IF;
END $$;
