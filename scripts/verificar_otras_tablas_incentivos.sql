-- Verificar si existe la tabla sales_vehicles y qué campos tiene
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
ORDER BY ordinal_position;
