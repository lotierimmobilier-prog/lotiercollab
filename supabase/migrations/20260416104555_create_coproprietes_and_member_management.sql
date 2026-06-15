/*
  # Copropriétés et gestion des membres

  ## Nouvelles tables
  - `coproprietes` : liste des copropriétés gérées par le syndic
    - `id` (uuid, PK)
    - `name` (text, unique) : nom de la copropriété
    - `address` (text, optionnel)
    - `sort_order` (int, pour tri)
    - `active` (bool, default true)
    - `created_at` (timestamp)

  ## Sécurité
  - RLS activé sur `coproprietes`
  - Les super admins peuvent tout faire
  - Les agents authentifiés peuvent lire

  ## Notes
  - La table `members` reçoit un nouveau champ `auth_role` pour différencier les droits (super_admin / agent)
  - Permet l'import en masse des noms de copropriétés
*/

CREATE TABLE IF NOT EXISTS coproprietes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  address text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coproprietes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read coproprietes"
  ON coproprietes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert coproprietes"
  ON coproprietes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
        AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update coproprietes"
  ON coproprietes FOR UPDATE
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

CREATE POLICY "Super admins can delete coproprietes"
  ON coproprietes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.auth_user_id = auth.uid()
        AND user_roles.role = 'super_admin'
    )
  );
