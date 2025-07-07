-- Drop existing unique constraints if they exist, to ensure a clean slate
ALTER TABLE public.sales_quarterly_objectives
DROP CONSTRAINT IF EXISTS unique_sales_objective;

ALTER TABLE public.financial_penetration_objectives
DROP CONSTRAINT IF EXISTS unique_financial_objective;

-- Add unique constraint to sales_quarterly_objectives
-- This constraint ensures that for a given concesionario, marca, periodo_label, and año, there's only one entry.
ALTER TABLE public.sales_quarterly_objectives
ADD CONSTRAINT unique_sales_objective UNIQUE (concesionario, marca, periodo_label, año);

-- Add unique constraint to financial_penetration_objectives
-- This constraint ensures that for a given concesionario and año, there's only one entry.
ALTER TABLE public.financial_penetration_objectives
ADD CONSTRAINT unique_financial_objective UNIQUE (concesionario, año);

-- Ensure RLS is enabled for both tables
ALTER TABLE public.sales_quarterly_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_penetration_objectives ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if they exist, to ensure a clean slate
DROP POLICY IF EXISTS "Enable read access for all authenticated users on sales_quarterly_objectives" ON public.sales_quarterly_objectives;
DROP POLICY IF EXISTS "Enable write access for authenticated users on sales_quarterly_objectives" ON public.sales_quarterly_objectives;
DROP POLICY IF EXISTS "Enable update access for authenticated users on sales_quarterly_objectives" ON public.sales_quarterly_objectives;

DROP POLICY IF EXISTS "Enable read access for all authenticated users on financial_penetration_objectives" ON public.financial_penetration_objectives;
DROP POLICY IF EXISTS "Enable write access for authenticated users on financial_penetration_objectives" ON public.financial_penetration_objectives;
DROP POLICY IF EXISTS "Enable update access for authenticated users on financial_penetration_objectives" ON public.financial_penetration_objectives;

-- Create RLS policies for sales_quarterly_objectives
CREATE POLICY "Enable read access for all authenticated users on sales_quarterly_objectives"
ON public.sales_quarterly_objectives
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users on sales_quarterly_objectives"
ON public.sales_quarterly_objectives
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users on sales_quarterly_objectives"
ON public.sales_quarterly_objectives
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Create RLS policies for financial_penetration_objectives
CREATE POLICY "Enable read access for all authenticated users on financial_penetration_objectives"
ON public.financial_penetration_objectives
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users on financial_penetration_objectives"
ON public.financial_penetration_objectives
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users on financial_penetration_objectives"
ON public.financial_penetration_objectives
FOR UPDATE
USING (auth.role() = 'authenticated');
