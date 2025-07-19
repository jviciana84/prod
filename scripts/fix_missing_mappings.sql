-- =====================================================
-- ARREGLAR MAPEOS FALTANTES
-- =====================================================
-- Verificar y activar los mapeos básicos que faltan
-- =====================================================

-- 1. Ver todos los mapeos existentes
SELECT '=== TODOS LOS MAPEOS EXISTENTES ===' as info;

SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
ORDER BY duc_scraper_column;

-- 2. Ver específicamente los mapeos básicos que necesitamos
SELECT '=== MAPEOS BÁSICOS QUE NECESITAMOS ===' as info;

SELECT 
    'Matrícula' as duc_column,
    'license_plate' as nuevas_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM column_mappings WHERE duc_scraper_column = 'Matrícula' AND nuevas_entradas_column = 'license_plate') 
        THEN '✅ EXISTE' 
        ELSE '❌ FALTA' 
    END as estado
UNION ALL
SELECT 
    'Modelo' as duc_column,
    'model' as nuevas_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM column_mappings WHERE duc_scraper_column = 'Modelo' AND nuevas_entradas_column = 'model') 
        THEN '✅ EXISTE' 
        ELSE '❌ FALTA' 
    END as estado
UNION ALL
SELECT 
    'Fecha compra DMS' as duc_column,
    'purchase_date' as nuevas_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM column_mappings WHERE duc_scraper_column = 'Fecha compra DMS' AND nuevas_entradas_column = 'purchase_date') 
        THEN '✅ EXISTE' 
        ELSE '❌ FALTA' 
    END as estado;

-- 3. Activar todos los mapeos básicos que existan
UPDATE column_mappings 
SET is_active = true 
WHERE duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')
AND nuevas_entradas_column IN ('license_plate', 'model', 'purchase_date');

-- 4. Verificar mapeos activados
SELECT '=== MAPEOS ACTIVADOS DESPUÉS DE LA ACTUALIZACIÓN ===' as info;

SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')
ORDER BY duc_scraper_column;

-- 5. Crear trigger automático si no existe
SELECT '=== CREANDO TRIGGER AUTOMÁTICO ===' as info;

-- Crear función del trigger
CREATE OR REPLACE FUNCTION auto_process_filters_on_duc_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Llamar a la función de procesamiento de filtros
    PERFORM process_filter_configs();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_auto_process_filters ON duc_scraper;
CREATE TRIGGER trigger_auto_process_filters
    AFTER INSERT OR UPDATE ON duc_scraper
    FOR EACH ROW
    EXECUTE FUNCTION auto_process_filters_on_duc_update();

-- 6. Verificar que el trigger se creó
SELECT '=== VERIFICACIÓN DEL TRIGGER ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper'
AND trigger_name = 'trigger_auto_process_filters';

-- 7. Estado final
SELECT '=== ESTADO FINAL ===' as info;

WITH summary AS (
    SELECT 
        (SELECT COUNT(*) FROM filter_configs WHERE is_active = true AND auto_process = true) as configs_activas_auto,
        (SELECT COUNT(*) FROM column_mappings WHERE is_active = true AND duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')) as mapeos_basicos_activos,
        (SELECT COUNT(*) FROM duc_scraper) as registros_duc,
        (SELECT COUNT(*) FROM nuevas_entradas) as registros_nuevas_entradas,
        (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'duc_scraper' AND trigger_name = 'trigger_auto_process_filters') as trigger_activo
)
SELECT 
    'CONFIGURACIÓN CON AUTO_PROCESS' as item,
    configs_activas_auto as valor,
    CASE 
        WHEN configs_activas_auto > 0 THEN '✅ OK - Configuración activa'
        ELSE '❌ PROBLEMA: No hay configuración activa'
    END as estado
FROM summary
UNION ALL
SELECT 
    'MAPEOS BÁSICOS ACTIVOS' as item,
    mapeos_basicos_activos as valor,
    CASE 
        WHEN mapeos_basicos_activos >= 3 THEN '✅ OK - Mapeos básicos activos'
        ELSE '❌ PROBLEMA: Faltan mapeos básicos'
    END as estado
FROM summary
UNION ALL
SELECT 
    'TRIGGER AUTOMÁTICO' as item,
    trigger_activo as valor,
    CASE 
        WHEN trigger_activo > 0 THEN '✅ OK - Trigger activo'
        ELSE '❌ PROBLEMA: No hay trigger automático'
    END as estado
FROM summary
UNION ALL
SELECT 
    'DATOS EN DUC_SCRAPER' as item,
    registros_duc as valor,
    CASE 
        WHEN registros_duc > 0 THEN '✅ OK - Hay datos para procesar'
        ELSE '❌ PROBLEMA: No hay datos en duc_scraper'
    END as estado
FROM summary
UNION ALL
SELECT 
    'REGISTROS EN NUEVAS_ENTRADAS' as item,
    registros_nuevas_entradas as valor,
    'ℹ️ INFO - Registros actuales' as estado
FROM summary; 