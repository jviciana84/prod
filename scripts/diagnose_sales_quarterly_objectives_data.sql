-- Script para diagnosticar la estructura y los datos de la tabla sales_quarterly_objectives

-- 1. Verificar la estructura de la tabla sales_quarterly_objectives
-- Esto nos mostrará los nombres exactos de las columnas y sus tipos de datos.
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

-- 2. Mostrar todos los datos de la tabla sales_quarterly_objectives
-- Esto es crucial para ver los valores exactos de 'año', 'periodo_label', 'concesionario' y 'marca'.
-- Si la tabla es muy grande, puedes cambiar LIMIT 100 a un número menor o mayor.
SELECT *
FROM public.sales_quarterly_objectives
LIMIT 100;
