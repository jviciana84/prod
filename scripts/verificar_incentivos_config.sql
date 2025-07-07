-- Verificar si existe la tabla incentivos_config
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'incentivos_config' 
AND table_schema = 'public'
ORDER BY ordinal_position;
