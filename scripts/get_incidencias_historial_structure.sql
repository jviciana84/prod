SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' -- O el esquema que estés usando
AND 
    table_name = 'incidencias_historial';
