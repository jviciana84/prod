-- =====================================================
-- DIAGNÓSTICO DEL SISTEMA AUTOMÁTICO
-- =====================================================
-- Verificar por qué no funciona la captura automática
-- =====================================================

-- 1. Verificar datos actuales
SELECT '=== DATOS ACTUALES ===' as info;

SELECT 
    'duc_scraper' as tabla,
    COUNT(*) as total_registros
FROM duc_scraper
UNION ALL
SELECT 
    'nuevas_entradas' as tabla,
    COUNT(*) as total_registros
FROM nuevas_entradas;

-- 2. Verificar configuración activa
SELECT '=== CONFIGURACIÓN ACTIVA ===' as info;

SELECT 
    id,
    name,
    description,
    is_active,
    auto_process,
    disponibilidad_filter,
    marca_filter,
    precio_min,
    precio_max,
    km_min,
    km_max,
    libre_siniestros,
    concesionario_filter,
    combustible_filter,
    año_min,
    año_max,
    dias_stock_min,
    dias_stock_max
FROM filter_configs 
WHERE is_active = true AND auto_process = true;

-- 3. Verificar mapeos activos
SELECT '=== MAPEOS ACTIVOS ===' as info;

SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')
ORDER BY duc_scraper_column;

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

-- 5. Verificar función del trigger
SELECT '=== FUNCIÓN DEL TRIGGER ===' as info;

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'auto_process_filters_on_duc_update';

-- 6. Verificar si existe la función process_filter_configs
SELECT '=== FUNCIÓN PROCESS_FILTER_CONFIGS ===' as info;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- 7. Probar manualmente el procesamiento
SELECT '=== PRUEBA MANUAL ===' as info;

-- Ver algunos registros de duc_scraper para ver si cumplen filtros
SELECT 
    "Matrícula",
    "Modelo", 
    "Fecha compra DMS",
    "Disponibilidad",
    "Marca",
    "Precio",
    "KM",
    "Libre de siniestros",
    "Combustible",
    "Fecha fabricación",
    "Días stock"
FROM duc_scraper 
LIMIT 5;

-- 8. Verificar si hay registros que cumplan los filtros
SELECT '=== REGISTROS QUE CUMPLEN FILTROS ===' as info;

SELECT 
    COUNT(*) as registros_cumplen_filtros
FROM duc_scraper 
WHERE 
    ("Disponibilidad" = 'DISPONIBLE' OR "Disponibilidad" IS NULL)
    AND ("Marca" IS NOT NULL OR "Marca" IS NULL)
    AND ("Precio" IS NOT NULL OR "Precio" IS NULL)
    AND ("KM" IS NOT NULL OR "KM" IS NULL)
    AND ("Libre de siniestros" IS NOT NULL OR "Libre de siniestros" IS NULL)
    AND ("Combustible" IS NOT NULL OR "Combustible" IS NULL)
    AND ("Fecha fabricación" IS NOT NULL OR "Fecha fabricación" IS NULL)
    AND ("Días stock" IS NOT NULL OR "Días stock" IS NULL);

-- 9. Verificar logs de procesamiento
SELECT '=== LOGS DE PROCESAMIENTO ===' as info;

SELECT 
    id,
    filter_config_id,
    processed_at,
    vehicles_processed,
    vehicles_inserted,
    vehicles_skipped,
    error_message
FROM filter_processing_log 
ORDER BY processed_at DESC 
LIMIT 10;

-- 10. Estado final
SELECT '=== ESTADO FINAL ===' as info;

WITH summary AS (
    SELECT 
        (SELECT COUNT(*) FROM filter_configs WHERE is_active = true AND auto_process = true) as configs_activas_auto,
        (SELECT COUNT(*) FROM column_mappings WHERE is_active = true AND duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')) as mapeos_basicos_activos,
        (SELECT COUNT(*) FROM duc_scraper) as registros_duc,
        (SELECT COUNT(*) FROM nuevas_entradas) as registros_nuevas_entradas,
        (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'duc_scraper' AND trigger_name = 'trigger_auto_process_filters') as trigger_activo,
        (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'process_filter_configs') as funcion_existe
)
SELECT 
    'CONFIGURACIÓN CON AUTO_PROCESS' as item,
    configs_activas_auto as valor,
    CASE 
        WHEN configs_activas_auto > 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA'
    END as estado
FROM summary
UNION ALL
SELECT 
    'MAPEOS BÁSICOS ACTIVOS' as item,
    mapeos_basicos_activos as valor,
    CASE 
        WHEN mapeos_basicos_activos >= 3 THEN '✅ OK'
        ELSE '❌ PROBLEMA'
    END as estado
FROM summary
UNION ALL
SELECT 
    'TRIGGER AUTOMÁTICO' as item,
    trigger_activo as valor,
    CASE 
        WHEN trigger_activo > 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA'
    END as estado
FROM summary
UNION ALL
SELECT 
    'FUNCIÓN PROCESS_FILTER_CONFIGS' as item,
    funcion_existe as valor,
    CASE 
        WHEN funcion_existe > 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA - FALTA FUNCIÓN'
    END as estado
FROM summary
UNION ALL
SELECT 
    'DATOS EN DUC_SCRAPER' as item,
    registros_duc as valor,
    CASE 
        WHEN registros_duc > 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA'
    END as estado
FROM summary
UNION ALL
SELECT 
    'REGISTROS EN NUEVAS_ENTRADAS' as item,
    registros_nuevas_entradas as valor,
    'ℹ️ INFO' as estado
FROM summary; 