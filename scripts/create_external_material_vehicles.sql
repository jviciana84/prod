CREATE TABLE IF NOT EXISTS external_material_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
); 