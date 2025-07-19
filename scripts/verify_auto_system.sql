-- =====================================================
-- VERIFICAR SISTEMA AUTOMÁTICO
-- =====================================================

-- 1. Verificar configuraciones activas con auto_process
SELECT '=== CONFIGURACIONES AUTOMÁTICAS ACTIVAS ===' as info;
SELECT 
    id,
    name,
    description,
    is_active,
    auto_process,
    created_at
FROM filter_configs 
WHERE is_active = true AND auto_process = true;

-- 2. Verificar que el trigger esté activo
SELECT '=== TRIGGER AUTOMÁTICO ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper'
    AND trigger_name = 'trigger_auto_process_filters';

-- 3. Verificar que la función existe
SELECT '=== FUNCIÓN DE PROCESAMIENTO ===' as info;
SELECT 
    routine_name,
    routine_type,
    routine_definition IS NOT NULL as tiene_definicion
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- 4. Verificar mapeos de columnas activos
SELECT '=== MAPEOS DE COLUMNAS ACTIVOS ===' as info;
SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE is_active = true;

-- 5. Probar inserción automática (simular nuevo dato)
SELECT '=== PRUEBA DE INSERCIÓN AUTOMÁTICA ===' as info;
-- Insertar un registro de prueba
INSERT INTO duc_scraper (
    "ID Anuncio",
    "Matrícula",
    "Modelo",
    "Marca",
    "Precio",
    "Fecha compra DMS",
    "Disponibilidad"
) VALUES (
    'TEST-AUTO-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'TEST' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'Modelo Test Automático',
    'BMW',
    '50000',
    '15-07-2024',
    'Disponible'
) ON CONFLICT ("ID Anuncio") DO NOTHING;

-- 6. Verificar si se procesó automáticamente
SELECT '=== VERIFICAR PROCESAMIENTO AUTOMÁTICO ===' as info;
SELECT 
    'Registro de prueba insertado en duc_scraper' as status,
    COUNT(*) as total_en_duc_scraper
FROM duc_scraper 
WHERE "Matrícula" LIKE 'TEST%';

SELECT 
    'Registro procesado automáticamente' as status,
    COUNT(*) as total_en_nuevas_entradas
FROM nuevas_entradas 
WHERE license_plate LIKE 'TEST%';

-- 7. Ver logs de procesamiento recientes
SELECT '=== LOGS DE PROCESAMIENTO RECIENTES ===' as info;
SELECT 
    id,
    filter_config_id,
    processed_by,
    created_at
FROM filter_processing_log 
ORDER BY created_at DESC 
LIMIT 3; 