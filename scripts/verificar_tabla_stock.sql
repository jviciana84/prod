-- Verificar si existe la tabla stock y qué campos tiene
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'stock' 
ORDER BY ordinal_position;
