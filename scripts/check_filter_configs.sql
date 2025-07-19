-- =====================================================
-- VERIFICAR CONFIGURACIONES DE FILTROS
-- =====================================================

-- 1. Ver todas las configuraciones de filtros
SELECT '=== TODAS LAS CONFIGURACIONES ===' as info;
SELECT 
    id,
    name,
    description,
    is_active,
    auto_process,
    created_at
FROM filter_configs 
ORDER BY created_at DESC;

-- 2. Ver configuraciones activas con auto_process
SELECT '=== CONFIGURACIONES ACTIVAS CON AUTO_PROCESS ===' as info;
SELECT 
    id,
    name,
    description,
    is_active,
    auto_process
FROM filter_configs 
WHERE is_active = true AND auto_process = true;

-- 3. Ver mapeos de columnas activos
SELECT '=== MAPEOS DE COLUMNAS ACTIVOS ===' as info;
SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE is_active = true;

-- 4. Verificar trigger
SELECT '=== TRIGGER ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper'; 