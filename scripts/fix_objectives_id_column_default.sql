-- Paso 1: Verificar la definición actual de la columna 'id' para ambas tablas
-- Esto nos mostrará si es una clave primaria, si es NOT NULL y si tiene un valor por defecto.
SELECT
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    a.attnotnull AS is_not_null,
    pg_get_expr(d.adbin, d.adrelid) AS default_value,
    con.conname AS constraint_name,
    con.contype AS constraint_type
FROM
    pg_attribute a
JOIN
    pg_class t ON a.attrelid = t.oid
LEFT JOIN
    pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
LEFT JOIN
    pg_constraint con ON con.conrelid = t.oid AND a.attnum = ANY(con.conkey)
WHERE
    t.relname IN ('sales_quarterly_objectives', 'financial_penetration_objectives')
    AND a.attname = 'id'
    AND a.attnum > 0;

-- Paso 2: Asegurar que gen_random_uuid() esté configurado como valor por defecto para la columna 'id'.
-- Esto se hará solo si el valor por defecto no está ya configurado como gen_random_uuid().
-- Esta operación es segura para columnas de clave primaria.

DO $$
BEGIN
    -- Para sales_quarterly_objectives
    IF NOT EXISTS (
        SELECT 1
        FROM pg_attribute a
        JOIN pg_class t ON a.attrelid = t.oid
        LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
        WHERE t.relname = 'sales_quarterly_objectives'
        AND a.attname = 'id'
        AND pg_get_expr(d.adbin, d.adrelid) = 'gen_random_uuid()'
    ) THEN
        ALTER TABLE public.sales_quarterly_objectives ALTER COLUMN id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Default value for sales_quarterly_objectives.id set to gen_random_uuid()';
    ELSE
        RAISE NOTICE 'Default value for sales_quarterly_objectives.id is already gen_random_uuid()';
    END IF;

    -- Para financial_penetration_objectives
    IF NOT EXISTS (
        SELECT 1
        FROM pg_attribute a
        JOIN pg_class t ON a.attrelid = t.oid
        LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
        WHERE t.relname = 'financial_penetration_objectives'
        AND a.attname = 'id'
        AND pg_get_expr(d.adbin, d.adrelid) = 'gen_random_uuid()'
    ) THEN
        ALTER TABLE public.financial_penetration_objectives ALTER COLUMN id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Default value for financial_penetration_objectives.id set to gen_random_uuid()';
    ELSE
        RAISE NOTICE 'Default value for financial_penetration_objectives.id is already gen_random_uuid()';
    END IF;
END $$;

-- Paso 3: Verificar nuevamente la definición de la columna 'id' para confirmar los cambios
SELECT
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    a.attnotnull AS is_not_null,
    pg_get_expr(d.adbin, d.adrelid) AS default_value,
    con.conname AS constraint_name,
    con.contype AS constraint_type
FROM
    pg_attribute a
JOIN
    pg_class t ON a.attrelid = t.oid
LEFT JOIN
    pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
LEFT JOIN
    pg_constraint con ON con.conrelid = t.oid AND a.attnum = ANY(con.conkey)
WHERE
    t.relname IN ('sales_quarterly_objectives', 'financial_penetration_objectives')
    AND a.attname = 'id'
    AND a.attnum > 0;
