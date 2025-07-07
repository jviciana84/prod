-- Obtener todos los campos de sales_vehicles en formato fácil de copiar
SELECT 
    string_agg(
        column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || COALESCE(character_maximum_length::text, '255') || ')'
            WHEN data_type = 'text' THEN 'TEXT'
            WHEN data_type = 'integer' THEN 'INTEGER'
            WHEN data_type = 'bigint' THEN 'BIGINT'
            WHEN data_type = 'boolean' THEN 'BOOLEAN'
            WHEN data_type = 'numeric' THEN 'DECIMAL(' || COALESCE(numeric_precision::text, '10') || ',' || COALESCE(numeric_scale::text, '2') || ')'
            WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMP WITH TIME ZONE'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
            WHEN data_type = 'date' THEN 'DATE'
            WHEN data_type = 'uuid' THEN 'UUID'
            ELSE UPPER(data_type)
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        E',\n  '
        ORDER BY ordinal_position
    ) as campos_formateados
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
  AND table_schema = 'public';
