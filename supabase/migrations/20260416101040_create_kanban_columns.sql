/*
  # Create kanban_columns table

  1. New Tables
    - `kanban_columns`
      - `id` (text, primary key) — the status key used in tasks (e.g. 'todo', 'doing', 'done', 'blocked')
      - `label` (text) — display name of the column
      - `dot_color` (text) — tailwind bg color class for the dot indicator
      - `sort_order` (integer) — display order
      - `created_at` (timestamptz)

  2. Seed data
    - Insert the 4 default columns in order

  3. Security
    - Enable RLS
    - Authenticated users can read columns
    - Only authenticated users can insert/update/delete
*/

CREATE TABLE IF NOT EXISTS kanban_columns (
  id text PRIMARY KEY,
  label text NOT NULL,
  dot_color text NOT NULL DEFAULT 'bg-gray-400',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read kanban columns"
  ON kanban_columns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert kanban columns"
  ON kanban_columns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update kanban columns"
  ON kanban_columns FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete kanban columns"
  ON kanban_columns FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

INSERT INTO kanban_columns (id, label, dot_color, sort_order) VALUES
  ('todo',    'À faire',  'bg-gray-400',  0),
  ('doing',   'En cours', 'bg-blue-500',  1),
  ('done',    'Terminé',  'bg-green-500', 2),
  ('blocked', 'Bloqué',   'bg-red-500',   3)
ON CONFLICT (id) DO NOTHING;
