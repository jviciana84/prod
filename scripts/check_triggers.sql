-- =====================================================
-- VERIFICAR TRIGGERS EN DUC_SCRAPER
-- =====================================================

-- 1. Verificar triggers en duc_scraper
SELECT '=== TRIGGERS EN DUC_SCRAPER ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper';

-- 2. Verificar funciones relacionadas
SELECT '=== FUNCIONES ===' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%filter%' OR routine_name LIKE '%process%';

-- 3. Verificar si existe la función problemática
SELECT '=== VERIFICAR FUNCIÓN PROBLEMÁTICA ===' as info;
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs'; 