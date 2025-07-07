-- Verificar la estructura de la tabla stock
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stock' 
ORDER BY ordinal_position;

-- Verificar la estructura de la tabla fotos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fotos' 
ORDER BY ordinal_position;
