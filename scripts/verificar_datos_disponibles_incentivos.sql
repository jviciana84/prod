-- Verificar estructura de la tabla entregas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'entregas' 
ORDER BY ordinal_position;
