-- Script para verificar la estructura de las tablas de objetivos y sus políticas RLS
-- Utiliza information_schema para mayor compatibilidad

SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    (SELECT relrowsecurity FROM pg_class WHERE relname = c.table_name::text) AS row_level_security_enabled
FROM
    information_schema.columns AS c
WHERE
    c.table_schema = 'public' AND c.table_name IN ('sales_quarterly_objectives', 'financial_penetration_objectives')
ORDER BY
    c.table_name, c.ordinal_position;

-- Opcional: Verificar las políticas RLS directamente
SELECT
    polname AS policy_name,
    tablename AS table_name,
    cmd AS command,
    permissive,
    qual AS using_expression,
    with_check AS with_check_expression,
    roles AS policy_roles
FROM
    pg_policies
WHERE
    tablename IN ('sales_quarterly_objectives', 'financial_penetration_objectives');
