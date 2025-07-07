-- Diagnóstico de la tabla 'entregas' y sus triggers

    -- 1. Verificar la definición de la columna 'observaciones' en 'entregas'
    SELECT
       column_name,
       data_type,
       is_nullable,
       column_default
    FROM
       information_schema.columns
    WHERE
       table_schema = 'public' AND table_name = 'entregas' AND column_name = 'observaciones';

    -- 2. Listar todos los triggers en la tabla 'entregas'
    SELECT
       tgname AS trigger_name,
       pg_get_triggerdef(t.oid) AS trigger_definition
    FROM
       pg_trigger t
    JOIN
       pg_class c ON t.tgrelid = c.oid
    WHERE
       c.relname = 'entregas';

    -- 3. Listar todos los triggers en la tabla 'sales_vehicles' (por si hay otro que afecte a 'entregas')
    SELECT
       tgname AS trigger_name,
       pg_get_triggerdef(t.oid) AS trigger_definition
    FROM
       pg_trigger t
    JOIN
       pg_class c ON t.tgrelid = c.oid
    WHERE
       c.relname = 'sales_vehicles';

    -- 4. Mostrar las últimas 5 filas de 'entregas' para ver el campo 'observaciones'
    SELECT
       id,
       matricula,
       fecha_entrega,
       incidencia,
       observaciones,
       created_at
    FROM
       public.entregas
    ORDER BY
       created_at DESC
    LIMIT 5;
