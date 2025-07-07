-- Habilitar RLS para sales_quarterly_objectives
ALTER TABLE public.sales_quarterly_objectives ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas RLS existentes para sales_quarterly_objectives (para evitar duplicados o conflictos)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.sales_quarterly_objectives;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.sales_quarterly_objectives;

-- Crear políticas RLS para sales_quarterly_objectives
CREATE POLICY "Allow authenticated read access to sales_quarterly_objectives"
ON public.sales_quarterly_objectives FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to sales_quarterly_objectives"
ON public.sales_quarterly_objectives FOR ALL
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Eliminar restricciones UNIQUE existentes para sales_quarterly_objectives (para recrearlas correctamente)
ALTER TABLE public.sales_quarterly_objectives DROP CONSTRAINT IF EXISTS unique_quarterly_objective;
ALTER TABLE public.sales_quarterly_objectives DROP CONSTRAINT IF EXISTS unique_sales_objective;

-- Añadir restricciones UNIQUE para sales_quarterly_objectives (usando las columnas exactas del onConflict)
ALTER TABLE public.sales_quarterly_objectives ADD CONSTRAINT unique_sales_objective UNIQUE (concesionario, marca, periodo_label, año);
-- Si también usas 'quarter' en algún onConflict, asegúrate de que esta también esté:
-- ALTER TABLE public.sales_quarterly_objectives ADD CONSTRAINT unique_quarterly_objective UNIQUE (concesionario, marca, quarter, año);


-- Habilitar RLS para financial_penetration_objectives
ALTER TABLE public.financial_penetration_objectives ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas RLS existentes para financial_penetration_objectives
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.financial_penetration_objectives;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.financial_penetration_objectives;

-- Crear políticas RLS para financial_penetration_objectives
CREATE POLICY "Allow authenticated read access to financial_penetration_objectives"
ON public.financial_penetration_objectives FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to financial_penetration_objectives"
ON public.financial_penetration_objectives FOR ALL
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Eliminar restricción UNIQUE existente para financial_penetration_objectives
ALTER TABLE public.financial_penetration_objectives DROP CONSTRAINT IF EXISTS unique_financial_objective;

-- Añadir restricción UNIQUE para financial_penetration_objectives (usando las columnas exactas del onConflict)
ALTER TABLE public.financial_penetration_objectives ADD CONSTRAINT unique_financial_objective UNIQUE (concesionario, año);

-- Opcional: Verificar el rol actual para depuración
SELECT current_user;
SELECT auth.role();
