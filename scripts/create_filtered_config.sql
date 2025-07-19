-- =====================================================
-- CONFIGURACIÓN CON FILTROS EXISTENTES
-- =====================================================
-- Usa los filtros que YA están registrados en filter_configs
-- =====================================================

-- 1. Ver qué filtros ya tienes configurados
SELECT '=== FILTROS EXISTENTES ===' as info;

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
ORDER BY created_at DESC;

-- 2. Ver qué mapeos de columnas ya existen
SELECT '=== MAPEOS DE COLUMNAS EXISTENTES ===' as info;

SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active,
    created_at
FROM column_mappings 
ORDER BY duc_scraper_column;

-- 3. Activar los mapeos básicos que necesitamos (si no están activos)
UPDATE column_mappings 
SET is_active = true 
WHERE duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')
AND is_active = false;

-- 4. Verificar mapeos activados
SELECT '=== MAPEOS ACTIVADOS ===' as info;

SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')
ORDER BY duc_scraper_column;

-- 5. Verificar que hay configuraciones activas con auto_process
SELECT '=== CONFIGURACIONES ACTIVAS ===' as info;

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
WHERE is_active = true AND auto_process = true
ORDER BY created_at DESC;

-- 6. Estado final del sistema
SELECT '=== ESTADO FINAL ===' as info;

WITH summary AS (
    SELECT 
        (SELECT COUNT(*) FROM filter_configs WHERE is_active = true AND auto_process = true) as configs_activas_auto,
        (SELECT COUNT(*) FROM column_mappings WHERE is_active = true) as mapeos_activos,
        (SELECT COUNT(*) FROM duc_scraper) as registros_duc,
        (SELECT COUNT(*) FROM nuevas_entradas) as registros_nuevas_entradas
)
SELECT 
    'CONFIGURACIONES ACTIVAS CON AUTO_PROCESS' as item,
    configs_activas_auto as valor,
    CASE 
        WHEN configs_activas_auto > 0 THEN '✅ OK - Sistema listo para captura automática con filtros existentes'
        ELSE '❌ PROBLEMA: No hay configuraciones activas con auto_process'
    END as estado
FROM summary
UNION ALL
SELECT 
    'MAPEOS DE COLUMNAS ACTIVOS' as item,
    mapeos_activos as valor,
    CASE 
        WHEN mapeos_activos >= 3 THEN '✅ OK - Mapeos básicos activados'
        ELSE '❌ PROBLEMA: Faltan mapeos básicos'
    END as estado
FROM summary
UNION ALL
SELECT 
    'REGISTROS EN DUC_SCRAPER' as item,
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

-- 7. Instrucciones para el usuario
SELECT '=== INSTRUCCIONES ===' as info;

SELECT 
    'Si no hay configuraciones activas, ve a la página de filtros y crea una nueva configuración con auto_process = true' as instruccion
WHERE NOT EXISTS (
    SELECT 1 FROM filter_configs 
    WHERE is_active = true AND auto_process = true
); 