CREATE TABLE IF NOT EXISTS financial_penetration_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concesionario TEXT NOT NULL,
  año INTEGER NOT NULL,
  objetivo_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 0, -- e.g., 75.50 for 75.5%
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE financial_penetration_objectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON financial_penetration_objectives;
CREATE POLICY "Enable read access for all users" ON financial_penetration_objectives FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON financial_penetration_objectives;
CREATE POLICY "Enable insert for authenticated users" ON financial_penetration_objectives FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON financial_penetration_objectives;
CREATE POLICY "Enable update for authenticated users" ON financial_penetration_objectives FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON financial_penetration_objectives;
CREATE POLICY "Enable delete for authenticated users" ON financial_penetration_objectives FOR DELETE USING (auth.role() = 'authenticated');

-- Add unique constraint to prevent duplicate objectives for the same year/concesionario
ALTER TABLE financial_penetration_objectives ADD CONSTRAINT unique_financial_objective UNIQUE (concesionario, año);

-- Create a trigger to update `updated_at` on each update
DROP TRIGGER IF EXISTS set_financial_penetration_objectives_updated_at ON financial_penetration_objectives;
CREATE TRIGGER set_financial_penetration_objectives_updated_at
BEFORE UPDATE ON financial_penetration_objectives
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
