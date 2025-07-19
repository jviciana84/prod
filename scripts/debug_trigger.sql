-- =====================================================
-- DEBUGGEAR TRIGGER
-- =====================================================

-- 1. Verificar si el dato se insertó en duc_scraper
SELECT '=== DATO EN DUC_SCRAPER ===' as info;
SELECT 
    id,
    "ID Anuncio",
    "Matrícula",
    "Modelo",
    "Marca",
    "Disponibilidad",
    import_date
FROM duc_scraper 
WHERE "Matrícula" = 'TEST123'
ORDER BY import_date DESC;

-- 2. Verificar configuraciones activas
SELECT '=== CONFIGURACIONES ACTIVAS ===' as info;
SELECT 
    id,
    name,
    is_active,
    auto_process
FROM filter_configs 
WHERE is_active = true AND auto_process = true;

-- 3. Probar función manualmente con el dato específico
SELECT '=== PROBANDO FUNCIÓN MANUAL ===' as info;
SELECT process_filter_configs();

-- 4. Verificar si apareció en nuevas_entradas
SELECT '=== VERIFICAR NUEVAS_ENTRADAS ===' as info;
SELECT 
    id,
    vehicle_type,
    license_plate,
    model,
    purchase_date,
    created_at
FROM nuevas_entradas 
WHERE license_plate = 'TEST123'
ORDER BY created_at DESC;

-- 5. Verificar logs de procesamiento
SELECT '=== LOGS DE PROCESAMIENTO ===' as info;
SELECT 
    id,
    filter_config_id,
    processed_by
FROM filter_processing_log 
ORDER BY id DESC 
LIMIT 5; 