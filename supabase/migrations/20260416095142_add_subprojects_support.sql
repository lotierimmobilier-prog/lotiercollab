/*
  # Add sub-projects support

  ## Changes
  - Adds `parent_id` column to `projects` table (nullable FK to self)
  - Adds `sort_order` column to `projects` for drag-and-drop reordering
  - Adds index on parent_id for fast lookups

  ## Notes
  1. Root projects have parent_id = NULL
  2. Sub-projects reference a parent project via parent_id
  3. sort_order is an integer used to order projects/sub-projects within the same level
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN parent_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE projects ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS projects_parent_id_idx ON projects(parent_id);
CREATE INDEX IF NOT EXISTS projects_sort_order_idx ON projects(sort_order);
