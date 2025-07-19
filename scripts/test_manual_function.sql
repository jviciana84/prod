-- =====================================================
-- PROBAR FUNCIÓN MANUALMENTE
-- =====================================================

-- 1. Ver datos en duc_scraper
SELECT '=== DATOS EN DUC_SCRAPER ===' as info;
SELECT COUNT(*) as total FROM duc_scraper;

-- 2. Ver datos en nuevas_entradas antes
SELECT '=== DATOS EN NUEVAS_ENTRADAS ANTES ===' as info;
SELECT COUNT(*) as total FROM nuevas_entradas;

-- 3. Ejecutar función manualmente
SELECT '=== EJECUTANDO FUNCIÓN ===' as info;
SELECT process_filter_configs();

-- 4. Ver datos en nuevas_entradas después
SELECT '=== DATOS EN NUEVAS_ENTRADAS DESPUÉS ===' as info;
SELECT COUNT(*) as total FROM nuevas_entradas;

-- 5. Ver últimos registros añadidos
SELECT '=== ÚLTIMOS REGISTROS AÑADIDOS ===' as info;
SELECT 
    id,
    vehicle_type,
    license_plate,
    model,
    purchase_date,
    is_received,
    created_at
FROM nuevas_entradas 
ORDER BY created_at DESC 
LIMIT 5; 