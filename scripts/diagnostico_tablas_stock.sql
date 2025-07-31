-- DIAGNÓSTICO COMPLETO DE TABLAS PARA STOCKTABLE
-- Verificar todas las tablas y columnas que usa el componente

-- 1. VERIFICAR TABLA STOCK
SELECT 
    'STOCK TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'stock' 
ORDER BY ordinal_position;

-- 2. VERIFICAR TABLA VEHICLE_SALE_STATUS
SELECT 
    'VEHICLE_SALE_STATUS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicle_sale_status' 
ORDER BY ordinal_position;

-- 3. VERIFICAR TABLA SALES_VEHICLES
SELECT 
    'SALES_VEHICLES TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
ORDER BY ordinal_position;

-- 4. VERIFICAR TABLA ENTREGAS
SELECT 
    'ENTREGAS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'entregas' 
ORDER BY ordinal_position;

-- 5. VERIFICAR TABLA FOTOS
SELECT 
    'FOTOS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'fotos' 
ORDER BY ordinal_position;

-- 6. VERIFICAR DATOS DE MUESTRA EN VEHICLE_SALE_STATUS
SELECT 
    'VEHICLE_SALE_STATUS SAMPLE DATA' as info,
    license_plate,
    model,
    sale_status,
    created_at
FROM vehicle_sale_status 
LIMIT 5;

-- 7. VERIFICAR DATOS DE MUESTRA EN SALES_VEHICLES
SELECT 
    'SALES_VEHICLES SAMPLE DATA' as info,
    license_plate,
    sold_before_body_ready,
    sold_before_photos_ready,
    created_at
FROM sales_vehicles 
LIMIT 5;

-- 8. VERIFICAR DATOS DE MUESTRA EN ENTREGAS
SELECT 
    'ENTREGAS SAMPLE DATA' as info,
    matricula,
    modelo,
    marca,
    fecha_entrega,
    asesor
FROM entregas 
LIMIT 5;

-- 9. VERIFICAR DATOS DE MUESTRA EN FOTOS
SELECT 
    'FOTOS SAMPLE DATA' as info,
    license_plate,
    model,
    photos_completed,
    estado_pintura,
    created_at
FROM fotos 
LIMIT 5;

-- 10. CONTAR REGISTROS EN CADA TABLA
SELECT 
    'RECORD COUNTS' as info,
    'stock' as table_name,
    COUNT(*) as total_records
FROM stock
UNION ALL
SELECT 
    'RECORD COUNTS' as info,
    'vehicle_sale_status' as table_name,
    COUNT(*) as total_records
FROM vehicle_sale_status
UNION ALL
SELECT 
    'RECORD COUNTS' as info,
    'sales_vehicles' as table_name,
    COUNT(*) as total_records
FROM sales_vehicles
UNION ALL
SELECT 
    'RECORD COUNTS' as info,
    'entregas' as table_name,
    COUNT(*) as total_records
FROM entregas
UNION ALL
SELECT 
    'RECORD COUNTS' as info,
    'fotos' as table_name,
    COUNT(*) as total_records
FROM fotos; 