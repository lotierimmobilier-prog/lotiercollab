/*
  # LOTIER Immobilier - Schema Initial

  ## Nouvelles Tables

  ### projects
  - Projets de l'agence (Syndic, Gestion locative, Vente)
  - Champs: id, name, color, created_at

  ### members
  - Collaborateurs et prestataires de l'agence
  - Champs: id, full_name, initials, email, avatar_color, role, created_at

  ### tasks
  - Tâches assignées aux membres par projet
  - Champs: id, title, description, project_id, assigned_to, status, priority, due_date, created_by, parent_id, created_at, updated_at

  ### comments
  - Commentaires sur les tâches (suppression en cascade)
  - Champs: id, task_id, author_id, body, created_at

  ### attachments
  - Pièces jointes sur les tâches (suppression en cascade)
  - Champs: id, task_id, file_name, file_url, uploaded_by, created_at

  ## Sécurité
  - RLS activé sur toutes les tables
  - Accès public en lecture/écriture pour usage interne (pas d'auth par utilisateur pour les membres)
  - Les politiques permettent l'accès aux utilisateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#378ADD',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  initials text NOT NULL,
  email text,
  avatar_color text NOT NULL DEFAULT '#1A3A5C',
  role text NOT NULL DEFAULT 'collaborateur',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES members(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done', 'blocked')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date date,
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id uuid REFERENCES members(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS comments_task_id_idx ON comments(task_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read members"
  ON members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert members"
  ON members FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update members"
  ON members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete members"
  ON members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read tasks"
  ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read comments"
  ON comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update comments"
  ON comments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete comments"
  ON comments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read attachments"
  ON attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert attachments"
  ON attachments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update attachments"
  ON attachments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete attachments"
  ON attachments FOR DELETE TO authenticated USING (true);
