-- =====================================================
-- VERIFICAR SI LA FUNCIÓN FUNCIONÓ
-- =====================================================

-- 1. Ver cuántos vehículos hay en duc_scraper
SELECT '=== VEHÍCULOS EN DUC_SCRAPER ===' as info;
SELECT 
    COUNT(*) as total_vehiculos,
    COUNT(DISTINCT "Matrícula") as matriculas_unicas
FROM duc_scraper;

-- 2. Ver cuántos vehículos hay en nuevas_entradas
SELECT '=== VEHÍCULOS EN NUEVAS_ENTRADAS ===' as info;
SELECT 
    COUNT(*) as total_vehiculos,
    COUNT(DISTINCT license_plate) as matriculas_unicas
FROM nuevas_entradas;

-- 3. Ver los últimos vehículos añadidos a nuevas_entradas
SELECT '=== ÚLTIMOS VEHÍCULOS AÑADIDOS ===' as info;
SELECT 
    id,
    vehicle_type,
    license_plate,
    model,
    purchase_date,
    purchase_price,
    created_at
FROM nuevas_entradas 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Verificar si hay vehículos en duc_scraper que NO están en nuevas_entradas
SELECT '=== VEHÍCULOS PENDIENTES DE PROCESAR ===' as info;
SELECT 
    d."Matrícula",
    d."Modelo",
    d."Fecha compra DMS",
    d."Precio"
FROM duc_scraper d
LEFT JOIN nuevas_entradas n ON d."Matrícula" = n.license_plate
WHERE n.license_plate IS NULL
    AND d."Matrícula" IS NOT NULL
    AND d."Modelo" IS NOT NULL
LIMIT 10;

-- 5. Ver logs de procesamiento recientes
SELECT '=== LOGS DE PROCESAMIENTO RECIENTES ===' as info;
SELECT 
    id,
    filter_config_id,
    processed_by,
    created_at
FROM filter_processing_log 
ORDER BY created_at DESC 
LIMIT 5; 