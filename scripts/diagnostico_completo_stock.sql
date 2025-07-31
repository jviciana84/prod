-- =====================================================
-- DIAGNÓSTICO COMPLETO DEL SISTEMA STOCK
-- =====================================================
-- Descripción: Verificar el estado completo de la tabla stock,
-- triggers, funciones, y sincronización con otras tablas
-- =====================================================

-- 1. VERIFICAR ESTRUCTURA DE LA TABLA STOCK
SELECT
    'ESTRUCTURA STOCK' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stock'
ORDER BY ordinal_position;

-- 2. VERIFICAR TOTAL DE REGISTROS EN STOCK
SELECT
    'TOTAL REGISTROS STOCK' as info,
    COUNT(*) as total_vehiculos,
    COUNT(CASE WHEN is_sold = true THEN 1 END) as vendidos,
    COUNT(CASE WHEN is_sold = false THEN 1 END) as disponibles,
    COUNT(CASE WHEN is_sold IS NULL THEN 1 END) as sin_estado
FROM stock;

-- 3. VERIFICAR VEHÍCULOS VENDIDOS EN STOCK
SELECT
    'VEHÍCULOS VENDIDOS EN STOCK' as info,
    license_plate,
    model,
    reception_date,
    is_sold,
    mechanical_status,
    body_status
FROM stock
WHERE is_sold = true
ORDER BY reception_date DESC
LIMIT 10;

-- 4. VERIFICAR VEHÍCULOS DISPONIBLES EN STOCK
SELECT
    'VEHÍCULOS DISPONIBLES EN STOCK' as info,
    license_plate,
    model,
    reception_date,
    is_sold,
    mechanical_status,
    body_status
FROM stock
WHERE is_sold = false OR is_sold IS NULL
ORDER BY reception_date DESC
LIMIT 10;

-- 5. VERIFICAR TRIGGERS EXISTENTES
SELECT
    'TRIGGERS EN DUC_SCRAPER' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'duc_scraper';

-- 6. VERIFICAR FUNCIONES EXISTENTES
SELECT
    'FUNCIONES RELACIONADAS' as info,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN (
    'handle_availability_change',
    'process_filter_configs',
    'auto_process_filters_on_duc_update'
)
ORDER BY routine_name;

-- 7. VERIFICAR SINCRONIZACIÓN CON DUC_SCRAPER
SELECT
    'SINCRONIZACIÓN DUC_SCRAPER vs STOCK' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    s.license_plate as stock_license_plate,
    s.is_sold,
    CASE 
        WHEN s.license_plate IS NULL THEN '❌ NO EN STOCK'
        WHEN ds."Disponibilidad" ILIKE '%reservado%' AND s.is_sold = true THEN '✅ SINCRONIZADO'
        WHEN ds."Disponibilidad" ILIKE '%disponible%' AND s.is_sold = false THEN '✅ SINCRONIZADO'
        ELSE '❌ DESINCRONIZADO'
    END as estado_sincronizacion
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
ORDER BY ds."last_seen_date" DESC
LIMIT 10;

-- 8. VERIFICAR SINCRONIZACIÓN CON FOTOS
SELECT
    'SINCRONIZACIÓN FOTOS vs STOCK' as info,
    f.license_plate,
    f.model as foto_model,
    s.model as stock_model,
    f.estado_pintura,
    s.is_sold,
    CASE 
        WHEN s.license_plate IS NULL THEN '❌ NO EN STOCK'
        WHEN f.estado_pintura = 'vendido' AND s.is_sold = true THEN '✅ SINCRONIZADO'
        WHEN f.estado_pintura != 'vendido' AND s.is_sold = false THEN '✅ SINCRONIZADO'
        ELSE '❌ DESINCRONIZADO'
    END as estado_sincronizacion
FROM fotos f
LEFT JOIN stock s ON f.license_plate = s.license_plate
WHERE f.estado_pintura = 'vendido'
ORDER BY f.created_at DESC
LIMIT 10;

-- 9. VERIFICAR SINCRONIZACIÓN CON SALES_VEHICLES
SELECT
    'SINCRONIZACIÓN SALES_VEHICLES vs STOCK' as info,
    sv.license_plate,
    sv.model,
    s.license_plate as stock_license_plate,
    s.is_sold,
    CASE 
        WHEN s.license_plate IS NULL THEN '❌ NO EN STOCK'
        WHEN s.is_sold = true THEN '✅ VENDIDO EN STOCK'
        ELSE '❌ NO MARCADO COMO VENDIDO'
    END as estado_sincronizacion
FROM sales_vehicles sv
LEFT JOIN stock s ON sv.license_plate = s.license_plate
ORDER BY sv.sale_date DESC
LIMIT 10;

-- 10. VERIFICAR SINCRONIZACIÓN CON VEHICLE_SALE_STATUS
SELECT
    'SINCRONIZACIÓN VEHICLE_SALE_STATUS vs STOCK' as info,
    vss.license_plate,
    vss.sale_status,
    s.license_plate as stock_license_plate,
    s.is_sold,
    CASE 
        WHEN s.license_plate IS NULL THEN '❌ NO EN STOCK'
        WHEN s.is_sold = true THEN '✅ VENDIDO EN STOCK'
        ELSE '❌ NO MARCADO COMO VENDIDO'
    END as estado_sincronizacion
FROM vehicle_sale_status vss
LEFT JOIN stock s ON vss.license_plate = s.license_plate
WHERE vss.sale_status IN ('vendido', 'profesional', 'tactico_vn')
ORDER BY vss.created_at DESC
LIMIT 10;

-- 11. RESUMEN DE SINCRONIZACIÓN
SELECT
    'RESUMEN GENERAL' as info,
    'DUC_SCRAPER RESERVADOS' as tabla,
    COUNT(*) as total
FROM duc_scraper
WHERE "Disponibilidad" ILIKE '%reservado%'
UNION ALL
SELECT
    'RESUMEN GENERAL' as info,
    'STOCK VENDIDOS' as tabla,
    COUNT(*) as total
FROM stock
WHERE is_sold = true
UNION ALL
SELECT
    'RESUMEN GENERAL' as info,
    'FOTOS VENDIDOS' as tabla,
    COUNT(*) as total
FROM fotos
WHERE estado_pintura = 'vendido'
UNION ALL
SELECT
    'RESUMEN GENERAL' as info,
    'SALES_VEHICLES' as tabla,
    COUNT(*) as total
FROM sales_vehicles
UNION ALL
SELECT
    'RESUMEN GENERAL' as info,
    'VEHICLE_SALE_STATUS VENDIDOS' as tabla,
    COUNT(*) as total
FROM vehicle_sale_status
WHERE sale_status IN ('vendido', 'profesional', 'tactico_vn'); 