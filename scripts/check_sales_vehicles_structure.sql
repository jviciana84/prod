-- Verificar la estructura actual de la tabla sales_vehicles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
