-- Add unique constraint to sales_quarterly_objectives
ALTER TABLE public.sales_quarterly_objectives
ADD CONSTRAINT unique_sales_objective UNIQUE (concesionario, marca, periodo_label, año);

-- Add unique constraint to financial_penetration_objectives
ALTER TABLE public.financial_penetration_objectives
ADD CONSTRAINT unique_financial_objective UNIQUE (concesionario, año);

-- Optional: Re-verify RLS policies if you suspect they are interfering with read/write
-- For sales_quarterly_objectives
-- DROP POLICY IF EXISTS "Enable read access for all users" ON public.sales_quarterly_objectives;
-- CREATE POLICY "Enable read access for all users" ON public.sales_quarterly_objectives FOR SELECT USING (true);
-- DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.sales_quarterly_objectives;
-- CREATE POLICY "Enable write access for authenticated users" ON public.sales_quarterly_objectives FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users" ON public.sales_quarterly_objectives FOR UPDATE USING (auth.role() = 'authenticated');

-- For financial_penetration_objectives
-- DROP POLICY IF EXISTS "Enable read access for all users" ON public.financial_penetration_objectives;
-- CREATE POLICY "Enable read access for all users" ON public.financial_penetration_objectives FOR SELECT USING (true);
-- DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.financial_penetration_objectives;
-- CREATE POLICY "Enable write access for authenticated users" ON public.financial_penetration_objectives FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users" ON public.financial_penetration_objectives FOR UPDATE USING (auth.role() = 'authenticated');
