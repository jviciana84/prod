-- Verificar la estructura completa de la tabla incentivos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'incentivos' 
ORDER BY ordinal_position;

-- Verificar que todos los campos necesarios existen
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incentivos' AND column_name = 'otros_observaciones') 
        THEN '✅ otros_observaciones existe'
        ELSE '❌ otros_observaciones NO existe'
    END as otros_observaciones_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incentivos' AND column_name = 'precio_compra') 
        THEN '✅ precio_compra existe'
        ELSE '❌ precio_compra NO existe'
    END as precio_compra_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incentivos' AND column_name = 'dias_stock') 
        THEN '✅ dias_stock existe'
        ELSE '❌ dias_stock NO existe'
    END as dias_stock_status;
