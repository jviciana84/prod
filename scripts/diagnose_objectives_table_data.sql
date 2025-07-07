-- Script para diagnosticar la estructura y los datos de las tablas de objetivos

-- 1. Verificar la estructura de la tabla sales_quarterly_objectives
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'sales_quarterly_objectives'
ORDER BY
    ordinal_position;

-- 2. Mostrar algunos datos de ejemplo de sales_quarterly_objectives para 2025 Q2
-- Esto nos ayudará a ver la capitalización y los valores exactos
SELECT *
FROM public.sales_quarterly_objectives
WHERE año = 2025 AND periodo_label = 'Q2'
LIMIT 5;

-- Si la consulta anterior no devuelve nada, muestra algunos datos de la tabla sin filtrar
SELECT *
FROM public.sales_quarterly_objectives
LIMIT 5;

-- 3. Verificar la estructura de la tabla financial_penetration_objectives
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'financial_penetration_objectives'
ORDER BY
    ordinal_position;

-- 4. Mostrar algunos datos de ejemplo de financial_penetration_objectives para 2025
SELECT *
FROM public.financial_penetration_objectives
WHERE año = 2025
LIMIT 5;

-- Si la consulta anterior no devuelve nada, muestra algunos datos de la tabla sin filtrar
SELECT *
FROM public.financial_penetration_objectives
LIMIT 5;

-- 5. (Opcional) Verificar las políticas RLS (con la columna corregida)
-- Esto es solo para confirmación, ya que dices que están desactivadas.
SELECT
    tablename AS table_name, -- Corregido de relname a tablename
    polname AS policy_name,
    perm AS policy_type,
    qual AS policy_condition,
    roles AS policy_roles
FROM
    pg_policies
WHERE
    schemaname = 'public' AND tablename IN ('sales_quarterly_objectives', 'financial_penetration_objectives');
