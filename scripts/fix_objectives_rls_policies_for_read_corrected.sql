-- Script para revisar y ajustar las políticas RLS para las tablas de objetivos
-- para permitir la lectura por parte de usuarios autenticados.

-- 1. Habilitar RLS si no está habilitado (aunque debería estarlo por defecto en Supabase)
ALTER TABLE public.sales_quarterly_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_penetration_objectives ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas RLS existentes que puedan estar causando problemas de lectura
-- Es importante ser cauteloso aquí. Si tienes políticas RLS complejas, considera ajustarlas
-- en lugar de eliminarlas por completo. Para este caso, asumimos que queremos permitir la lectura.

DROP POLICY IF EXISTS "Enable read access for authenticated users on sales_quarterly_objectives" ON public.sales_quarterly_objectives;
DROP POLICY IF EXISTS "Allow authenticated read for sales_quarterly_objectives" ON public.sales_quarterly_objectives;
DROP POLICY IF EXISTS "Allow all authenticated users to read sales_quarterly_objectives" ON public.sales_quarterly_objectives;

DROP POLICY IF EXISTS "Enable read access for authenticated users on financial_penetration_objectives" ON public.financial_penetration_objectives;
DROP POLICY IF EXISTS "Allow authenticated read for financial_penetration_objectives" ON public.financial_penetration_objectives;
DROP POLICY IF EXISTS "Allow all authenticated users to read financial_penetration_objectives" ON public.financial_penetration_objectives;


-- 3. Crear una nueva política RLS para permitir SELECT a todos los usuarios autenticados
-- para sales_quarterly_objectives
CREATE POLICY "Allow authenticated users to read sales_quarterly_objectives"
ON public.sales_quarterly_objectives
FOR SELECT
TO authenticated
USING (true); -- Permite leer todas las filas

-- 4. Crear una nueva política RLS para permitir SELECT a todos los usuarios autenticados
-- para financial_penetration_objectives
CREATE POLICY "Allow authenticated users to read financial_penetration_objectives"
ON public.financial_penetration_objectives
FOR SELECT
TO authenticated
USING (true); -- Permite leer todas las filas

-- Opcional: Verificar las políticas RLS después de la ejecución
SELECT
    relname AS table_name,
    polname AS policy_name,
    perm AS policy_type,
    qual AS policy_condition,
    roles AS policy_roles
FROM
    pg_policies
WHERE
    schemaname = 'public' AND relname IN ('sales_quarterly_objectives', 'financial_penetration_objectives');
