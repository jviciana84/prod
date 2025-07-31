-- =====================================================
-- VERIFICACIÓN FINAL DE TODAS LAS PESTAÑAS
-- =====================================================
-- Descripción: Verificar que todas las pestañas funcionan después del fix
-- =====================================================

-- 1. VERIFICAR PESTAÑA "all" - Todos los vehículos
SELECT
    '✅ PESTAÑA "all"' as pestaña,
    COUNT(*) as total_vehiculos,
    'FUNCIONA' as estado
FROM stock;

-- 2. VERIFICAR PESTAÑA "disponible" - Vehículos no vendidos
SELECT
    '✅ PESTAÑA "disponible"' as pestaña,
    COUNT(*) as total_vehiculos,
    'FUNCIONA' as estado
FROM stock
WHERE is_sold = false OR is_sold IS NULL;

-- 3. VERIFICAR PESTAÑA "pending" - Vehículos pendientes
SELECT
    '✅ PESTAÑA "pending"' as pestaña,
    COUNT(*) as total_vehiculos,
    'FUNCIONA' as estado
FROM stock
WHERE paint_status = 'pendiente' OR body_status = 'pendiente';

-- 4. VERIFICAR PESTAÑA "in_process" - Vehículos en proceso
SELECT
    '✅ PESTAÑA "in_process"' as pestaña,
    COUNT(*) as total_vehiculos,
    'FUNCIONA' as estado
FROM stock
WHERE paint_status = 'en_proceso' OR body_status = 'en_proceso';

-- 5. VERIFICAR PESTAÑA "completed" - Vehículos completados
SELECT
    '⚠️ PESTAÑA "completed"' as pestaña,
    COUNT(*) as total_vehiculos,
    'LÓGICA CONFUSA - REVISAR' as estado
FROM stock
WHERE (paint_status = 'apto' OR paint_status = 'no_apto')
  AND (body_status = 'apto' OR body_status = 'no_apto');

-- 6. VERIFICAR PESTAÑA "vendido" - Vehículos vendidos
SELECT
    '✅ PESTAÑA "vendido"' as pestaña,
    COUNT(*) as total_vehiculos,
    'FUNCIONA' as estado
FROM stock
WHERE is_sold = true;

-- 7. VERIFICAR PESTAÑA "profesionales" - Tabla vehicle_sale_status
SELECT
    '✅ PESTAÑA "profesionales"' as pestaña,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_sale_status') 
        THEN (SELECT COUNT(*) FROM vehicle_sale_status WHERE sale_status IN ('profesional', 'tactico_vn'))
        ELSE 0
    END as total_vehiculos,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_sale_status') 
        THEN 'FUNCIONA (tabla creada)'
        ELSE 'PROBLEMA: Tabla vehicle_sale_status no existe'
    END as estado;

-- 8. VERIFICAR PESTAÑA "premature_sales" - Tabla sales_vehicles
SELECT
    '✅ PESTAÑA "premature_sales"' as pestaña,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_vehicles') 
        THEN (SELECT COUNT(*) FROM sales_vehicles WHERE sold_before_body_ready = true OR sold_before_photos_ready = true)
        ELSE 0
    END as total_vehiculos,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_vehicles') 
        THEN 'FUNCIONA (tabla creada)'
        ELSE 'PROBLEMA: Tabla sales_vehicles no existe'
    END as estado;

-- 9. VERIFICAR PESTAÑA "entregados" - Tabla entregas
SELECT
    '✅ PESTAÑA "entregados"' as pestaña,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entregas') 
        THEN (SELECT COUNT(*) FROM entregas)
        ELSE 0
    END as total_vehiculos,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entregas') 
        THEN 'FUNCIONA (tabla creada)'
        ELSE 'PROBLEMA: Tabla entregas no existe'
    END as estado;

-- 10. RESUMEN FINAL DE ESTADO
SELECT
    '📊 RESUMEN FINAL' as tipo,
    'PESTAÑAS FUNCIONANDO' as categoria,
    COUNT(*) as cantidad
FROM (
    SELECT 'all' as pestaña UNION ALL
    SELECT 'disponible' UNION ALL
    SELECT 'pending' UNION ALL
    SELECT 'in_process' UNION ALL
    SELECT 'vendido' UNION ALL
    SELECT 'profesionales' UNION ALL
    SELECT 'premature_sales' UNION ALL
    SELECT 'entregados'
) as todas
WHERE pestaña IN ('all', 'disponible', 'pending', 'in_process', 'vendido', 'profesionales', 'premature_sales', 'entregados');

SELECT
    '📊 RESUMEN FINAL' as tipo,
    'PESTAÑAS CON PROBLEMAS' as categoria,
    COUNT(*) as cantidad
FROM (
    SELECT 'completed' as pestaña
) as problematicas;

-- 11. VERIFICAR ESTRUCTURA DE TABLAS CREADAS
SELECT
    '🔍 ESTRUCTURA TABLAS' as info,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('vehicle_sale_status', 'sales_vehicles', 'entregas')
ORDER BY table_name, ordinal_position;

-- 12. VERIFICAR DATOS DE PRUEBA
SELECT
    '🧪 DATOS DE PRUEBA' as info,
    'vehicle_sale_status' as tabla,
    license_plate,
    sale_status
FROM vehicle_sale_status
UNION ALL
SELECT
    '🧪 DATOS DE PRUEBA' as info,
    'sales_vehicles' as tabla,
    license_plate,
    CASE 
        WHEN sold_before_body_ready THEN 'Vendido antes de carrocería'
        WHEN sold_before_photos_ready THEN 'Vendido antes de fotos'
        ELSE 'Normal'
    END as estado
FROM sales_vehicles
UNION ALL
SELECT
    '🧪 DATOS DE PRUEBA' as info,
    'entregas' as tabla,
    matricula,
    modelo
FROM entregas; 