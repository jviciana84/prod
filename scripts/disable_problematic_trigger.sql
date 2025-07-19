-- =====================================================
-- DESHABILITAR TRIGGER PROBLEMÁTICO
-- =====================================================

-- 1. Deshabilitar el trigger que está causando problemas
SELECT '=== DESHABILITANDO TRIGGER ===' as info;

-- Deshabilitar trigger_auto_process_filters si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_auto_process_filters'
    ) THEN
        ALTER TABLE duc_scraper DISABLE TRIGGER trigger_auto_process_filters;
        RAISE NOTICE 'Trigger trigger_auto_process_filters deshabilitado';
    ELSE
        RAISE NOTICE 'Trigger trigger_auto_process_filters no encontrado';
    END IF;
END $$;

-- 2. Verificar triggers activos
SELECT '=== TRIGGERS ACTIVOS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper'; 