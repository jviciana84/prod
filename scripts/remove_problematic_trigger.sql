-- =====================================================
-- ELIMINAR TRIGGER PROBLEMÁTICO
-- =====================================================

-- 1. Eliminar el trigger problemático
SELECT '=== ELIMINANDO TRIGGER ===' as info;

DROP TRIGGER IF EXISTS trigger_auto_process_filters ON duc_scraper;

-- 2. Verificar que se eliminó
SELECT '=== TRIGGERS RESTANTES ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper';

-- 3. Verificar que la tabla está limpia
SELECT '=== TABLA DUC_SCRAPER ===' as info;
SELECT COUNT(*) as total_registros FROM duc_scraper; 