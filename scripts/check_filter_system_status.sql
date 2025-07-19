-- =====================================================
-- DIAGNÓSTICO DEL SISTEMA DE FILTROS Y MAPEOS
-- =====================================================
-- Ejecutar este script en Supabase SQL Editor para verificar el estado
-- =====================================================

-- 1. VERIFICAR TABLAS EXISTENTES
SELECT '=== 1. VERIFICACIÓN DE TABLAS ===' as info;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('filter_configs', 'column_mappings', 'filter_processing_log') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('filter_configs', 'column_mappings', 'filter_processing_log')
ORDER BY table_name;

-- 2. VERIFICAR CONFIGURACIONES DE FILTROS
SELECT '=== 2. CONFIGURACIONES DE FILTROS ===' as info;

SELECT 
    id,
    name,
    is_active,
    auto_process,
    disponibilidad_filter,
    marca_filter,
    precio_min,
    precio_max,
    created_at,
    last_used_at
FROM filter_configs 
ORDER BY created_at DESC;

-- 3. VERIFICAR CONFIGURACIONES ACTIVAS CON AUTO_PROCESS
SELECT '=== 3. CONFIGURACIONES ACTIVAS CON AUTO_PROCESS ===' as info;

SELECT 
    id,
    name,
    description,
    is_active,
    auto_process,
    disponibilidad_filter,
    marca_filter,
    precio_min,
    precio_max
FROM filter_configs 
WHERE is_active = true 
AND auto_process = true
ORDER BY created_at DESC;

-- 4. VERIFICAR MAPEOS DE COLUMNAS
SELECT '=== 4. MAPEOS DE COLUMNAS ===' as info;

SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active,
    transformation_rule
FROM column_mappings 
ORDER BY created_at DESC;

-- 5. VERIFICAR MAPEOS ACTIVOS
SELECT '=== 5. MAPEOS ACTIVOS ===' as info;

SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE is_active = true
ORDER BY created_at DESC;

-- 6. VERIFICAR HISTORIAL DE PROCESAMIENTO
SELECT '=== 6. HISTORIAL DE PROCESAMIENTO ===' as info;

SELECT 
    fpl.id,
    fc.name as config_name,
    fpl.status,
    fpl.total_vehicles_found,
    fpl.vehicles_processed,
    fpl.vehicles_added_to_nuevas_entradas,
    fpl.vehicles_skipped,
    fpl.errors_count,
    fpl.started_at,
    fpl.completed_at
FROM filter_processing_log fpl
LEFT JOIN filter_configs fc ON fpl.filter_config_id = fc.id
ORDER BY fpl.started_at DESC
LIMIT 10;

-- 7. VERIFICAR TRIGGERS
SELECT '=== 7. TRIGGERS ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_auto_process_filters', 'trigger_update_filter_configs_updated_at')
ORDER BY trigger_name;

-- 8. VERIFICAR DATOS EN DUC_SCRAPER
SELECT '=== 8. DATOS EN DUC_SCRAPER ===' as info;

SELECT 
    COUNT(*) as total_registros,
    COUNT(DISTINCT "ID Anuncio") as ids_unicos,
    COUNT(DISTINCT "Matrícula") as matriculas_unicas,
    MIN("Precio") as precio_minimo,
    MAX("Precio") as precio_maximo,
    MIN("KM") as km_minimo,
    MAX("KM") as km_maximo
FROM duc_scraper;

-- 9. VERIFICAR DATOS EN NUEVAS_ENTRADAS
SELECT '=== 9. DATOS EN NUEVAS_ENTRADAS ===' as info;

SELECT 
    COUNT(*) as total_registros,
    COUNT(DISTINCT license_plate) as matriculas_unicas,
    MIN(purchase_price) as precio_compra_minimo,
    MAX(purchase_price) as precio_compra_maximo
FROM nuevas_entradas;

-- 10. VERIFICAR CAMPOS NUEVOS EN NUEVAS_ENTRADAS
SELECT '=== 10. CAMPOS NUEVOS EN NUEVAS_ENTRADAS ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas' 
AND table_schema = 'public'
AND column_name IN ('purchase_price', 'origin', 'origin_details', 'purchase_date_duc', 'duc_import_date', 'duc_last_seen')
ORDER BY column_name;

-- 11. VERIFICAR CAMPOS EN DUC_SCRAPER
SELECT '=== 11. CAMPOS EN DUC_SCRAPER ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'
AND column_name IN ('Días stock', 'Matrícula', 'Modelo', 'Precio compra', 'Origen', 'Origenes unificados', 'ID Anuncio')
ORDER BY column_name;

-- 12. RESUMEN DE DIAGNÓSTICO
SELECT '=== 12. RESUMEN DE DIAGNÓSTICO ===' as info;

WITH summary AS (
    SELECT 
        (SELECT COUNT(*) FROM filter_configs WHERE is_active = true AND auto_process = true) as configs_activas_auto,
        (SELECT COUNT(*) FROM column_mappings WHERE is_active = true) as mapeos_activos,
        (SELECT COUNT(*) FROM duc_scraper) as registros_duc,
        (SELECT COUNT(*) FROM nuevas_entradas) as registros_nuevas_entradas,
        (SELECT COUNT(*) FROM filter_processing_log WHERE status = 'completed') as procesamientos_completados
)
SELECT 
    'CONFIGURACIONES ACTIVAS CON AUTO_PROCESS' as item,
    configs_activas_auto as valor,
    CASE 
        WHEN configs_activas_auto > 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA: No hay configuraciones activas con auto_process'
    END as estado
FROM summary
UNION ALL
SELECT 
    'MAPEOS DE COLUMNAS ACTIVOS' as item,
    mapeos_activos as valor,
    CASE 
        WHEN mapeos_activos > 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA: No hay mapeos de columnas activos'
    END as estado
FROM summary
UNION ALL
SELECT 
    'REGISTROS EN DUC_SCRAPER' as item,
    registros_duc as valor,
    CASE 
        WHEN registros_duc > 0 THEN '✅ OK'
        ELSE '❌ PROBLEMA: No hay datos en duc_scraper'
    END as estado
FROM summary
UNION ALL
SELECT 
    'REGISTROS EN NUEVAS_ENTRADAS' as item,
    registros_nuevas_entradas as valor,
    'ℹ️ INFO' as estado
FROM summary
UNION ALL
SELECT 
    'PROCESAMIENTOS COMPLETADOS' as item,
    procesamientos_completados as valor,
    'ℹ️ INFO' as estado
FROM summary; 