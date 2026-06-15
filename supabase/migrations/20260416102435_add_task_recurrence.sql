/*
  # Add recurrence to tasks

  1. Changes
    - `tasks` table: add two new columns
      - `recurrence` (text, nullable) — one of: '15d', '30d', '3m', '6m', '1y'
      - `next_recurrence_date` (date, nullable) — computed next trigger date

  2. Notes
    - recurrence is optional; null means no recurrence
    - next_recurrence_date is set automatically when a task is created or
      reset after completion (handled in application logic)
    - No data loss: uses IF NOT EXISTS checks on new columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'recurrence'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'next_recurrence_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN next_recurrence_date date DEFAULT NULL;
  END IF;
END $$;
