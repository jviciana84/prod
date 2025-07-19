-- =====================================================
-- ACTIVAR MAPEOS EXISTENTES Y CONFIGURACIÓN
-- =====================================================
-- Los mapeos ya existen, solo hay que activarlos
-- =====================================================

-- 1. Ver qué mapeos existen
SELECT '=== MAPEOS EXISTENTES ===' as info;

SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
ORDER BY duc_scraper_column;

-- 2. Activar los mapeos básicos que necesitamos
UPDATE column_mappings 
SET is_active = true 
WHERE duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS');

-- 3. Verificar mapeos activados
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

-- 4. Crear configuración de filtro (sin conflictos)
INSERT INTO filter_configs (
    name,
    description,
    is_active,
    auto_process,
    max_vehicles_per_batch,
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
) VALUES (
    'Captura Automática Simple',
    'Captura automáticamente matrícula, fecha de compra y modelo de duc_scraper a nuevas_entradas. El resto se completa manualmente.',
    true,  -- is_active
    true,  -- auto_process
    1000,  -- max_vehicles_per_batch
    NULL,  -- disponibilidad_filter (todos)
    NULL,  -- marca_filter (todas las marcas)
    NULL,  -- precio_min (sin límite)
    NULL,  -- precio_max (sin límite)
    NULL,  -- km_min (sin límite)
    NULL,  -- km_max (sin límite)
    NULL,  -- libre_siniestros (todos)
    NULL,  -- concesionario_filter (todos)
    NULL,  -- combustible_filter (todos)
    NULL,  -- año_min (sin límite)
    NULL,  -- año_max (sin límite)
    NULL,  -- dias_stock_min (sin límite)
    NULL   -- dias_stock_max (sin límite)
);

-- 5. Verificar configuración creada
SELECT '=== CONFIGURACIÓN CREADA ===' as info;

SELECT 
    id,
    name,
    description,
    is_active,
    auto_process,
    created_at
FROM filter_configs 
WHERE name = 'Captura Automática Simple';

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
        WHEN configs_activas_auto > 0 THEN '✅ OK - Sistema listo para captura automática'
        ELSE '❌ PROBLEMA: No hay configuraciones activas'
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