-- =====================================================
-- RECREAR TRIGGER AUTOMÁTICO FINAL
-- =====================================================

-- 1. Crear función para el trigger
CREATE OR REPLACE FUNCTION auto_process_filters_on_duc_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Procesar configuraciones activas con auto_process = true
    PERFORM process_filter_configs();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear trigger en duc_scraper
DROP TRIGGER IF EXISTS trigger_auto_process_filters ON duc_scraper;

CREATE TRIGGER trigger_auto_process_filters
    AFTER INSERT OR UPDATE ON duc_scraper
    FOR EACH ROW
    EXECUTE FUNCTION auto_process_filters_on_duc_update();

-- 3. Verificar que se creó correctamente
SELECT '=== TRIGGER CREADO ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper';

-- 4. Verificar función
SELECT '=== FUNCIÓN CREADA ===' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'auto_process_filters_on_duc_update'; 