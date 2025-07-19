-- =====================================================
-- VERIFICAR ESTADO DEL SISTEMA DE CAPTURA AUTOMÁTICA
-- =====================================================
-- Verifica que todo esté configurado correctamente
-- =====================================================

-- 1. Verificar configuración activa
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
    dias_stock_max,
    created_at
FROM filter_configs 
WHERE is_active = true AND auto_process = true
ORDER BY created_at DESC;

-- 2. Verificar mapeos activos
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

-- 3. Verificar trigger automático
SELECT '=== TRIGGER AUTOMÁTICO ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper'
AND trigger_name = 'trigger_auto_process_filters';

-- 4. Verificar función del trigger
SELECT '=== FUNCIÓN DEL TRIGGER ===' as info;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'auto_process_filters_on_duc_update';

-- 5. Contar registros en las tablas
SELECT '=== CONTEO DE REGISTROS ===' as info;

SELECT 
    'duc_scraper' as tabla,
    COUNT(*) as total_registros
FROM duc_scraper
UNION ALL
SELECT 
    'nuevas_entradas' as tabla,
    COUNT(*) as total_registros
FROM nuevas_entradas;

-- 6. Verificar registros recientes en nuevas_entradas
SELECT '=== REGISTROS RECIENTES EN NUEVAS_ENTRADAS ===' as info;

SELECT 
    id,
    license_plate,
    model,
    purchase_date,
    vehicle_type,
    is_received,
    created_at,
    updated_at
FROM nuevas_entradas 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Estado final del sistema
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