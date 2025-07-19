-- =====================================================
-- ARREGLAR PROBLEMA DEL TRIGGER
-- =====================================================

-- 1. Crear la función que falta
CREATE OR REPLACE FUNCTION process_filter_configs()
RETURNS void AS $$
BEGIN
    -- Función temporal que no hace nada
    -- Esto evita el error del trigger
    NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Verificar que la función se creó
SELECT '=== FUNCIÓN CREADA ===' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- 3. Verificar triggers
SELECT '=== TRIGGERS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper'; 