-- =====================================================
-- PROBAR FUNCIÓN MANUALMENTE CON DEBUG
-- =====================================================

-- 1. Ver datos en duc_scraper
SELECT '=== DATOS EN DUC_SCRAPER ===' as info;
SELECT COUNT(*) as total FROM duc_scraper;

-- 2. Ver datos en nuevas_entradas antes
SELECT '=== DATOS EN NUEVAS_ENTRADAS ANTES ===' as info;
SELECT COUNT(*) as total FROM nuevas_entradas;

-- 3. Ver configuraciones activas
SELECT '=== CONFIGURACIONES ACTIVAS ===' as info;
SELECT 
    id,
    name,
    is_active,
    auto_process
FROM filter_configs 
WHERE is_active = true AND auto_process = true;

-- 4. Ejecutar función manualmente
SELECT '=== EJECUTANDO FUNCIÓN ===' as info;
SELECT process_filter_configs();

-- 5. Ver datos en nuevas_entradas después
SELECT '=== DATOS EN NUEVAS_ENTRADAS DESPUÉS ===' as info;
SELECT COUNT(*) as total FROM nuevas_entradas;

-- 6. Ver últimos registros añadidos
SELECT '=== ÚLTIMOS REGISTROS AÑADIDOS ===' as info;
SELECT 
    id,
    vehicle_type,
    license_plate,
    model,
    purchase_date,
    created_at
FROM nuevas_entradas 
ORDER BY created_at DESC 
LIMIT 5; 