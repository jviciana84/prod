CREATE TABLE IF NOT EXISTS sales_quarterly_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concesionario TEXT NOT NULL,
  marca TEXT NOT NULL CHECK (marca IN ('BMW', 'MINI')),
  periodo_label TEXT NOT NULL, -- e.g., "Q1 (Ene-Mar)"
  año INTEGER NOT NULL,
  objetivo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE sales_quarterly_objectives ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own objectives (if applicable, or all if public)
-- For now, let's assume only admins can manage, and dashboard can read all.
-- If specific user objectives are needed, this policy needs refinement.
DROP POLICY IF EXISTS "Enable read access for all users" ON sales_quarterly_objectives;
CREATE POLICY "Enable read access for all users" ON sales_quarterly_objectives FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sales_quarterly_objectives;
CREATE POLICY "Enable insert for authenticated users" ON sales_quarterly_objectives FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON sales_quarterly_objectives;
CREATE POLICY "Enable update for authenticated users" ON sales_quarterly_objectives FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sales_quarterly_objectives;
CREATE POLICY "Enable delete for authenticated users" ON sales_quarterly_objectives FOR DELETE USING (auth.role() = 'authenticated');

-- Add unique constraint to prevent duplicate objectives for the same period/brand/concesionario
ALTER TABLE sales_quarterly_objectives ADD CONSTRAINT unique_quarterly_objective UNIQUE (concesionario, marca, periodo_label, año);

-- Create a trigger to update `updated_at` on each update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_sales_quarterly_objectives_updated_at ON sales_quarterly_objectives;
CREATE TRIGGER set_sales_quarterly_objectives_updated_at
BEFORE UPDATE ON sales_quarterly_objectives
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
