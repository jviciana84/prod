-- =====================================================
-- VERIFICAR ESTRUCTURA REAL DE FILTER_PROCESSING_LOG
-- =====================================================
-- Ver qué columnas existen realmente
-- =====================================================

-- 1. Ver estructura de filter_processing_log
SELECT '=== ESTRUCTURA DE FILTER_PROCESSING_LOG ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'filter_processing_log'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver algunos registros de ejemplo
SELECT '=== REGISTROS DE EJEMPLO ===' as info;

SELECT * FROM filter_processing_log LIMIT 5;

-- 3. Verificar si existe la función process_filter_configs
SELECT '=== FUNCIÓN PROCESS_FILTER_CONFIGS ===' as info;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- 4. Verificar trigger
SELECT '=== TRIGGER ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper'
AND trigger_name = 'trigger_auto_process_filters';

-- 5. Estado básico
SELECT '=== ESTADO BÁSICO ===' as info;

SELECT 
    (SELECT COUNT(*) FROM duc_scraper) as registros_duc,
    (SELECT COUNT(*) FROM nuevas_entradas) as registros_nuevas_entradas,
    (SELECT COUNT(*) FROM filter_configs WHERE is_active = true AND auto_process = true) as configs_activas,
    (SELECT COUNT(*) FROM column_mappings WHERE is_active = true AND duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')) as mapeos_activos; 