-- Verificar que la tabla pedidos_validados se creó correctamente
SELECT 
    'Tabla creada correctamente' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'pedidos_validados' 
  AND table_schema = 'public';

-- Ver la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pedidos_validados' 
  AND table_schema = 'public'
ORDER BY ordinal_position
LIMIT 10;
