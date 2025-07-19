-- =====================================================
-- CREAR CONFIGURACIÓN DE FILTRO BÁSICA
-- =====================================================
-- Este script crea una configuración que procesa automáticamente
-- todos los vehículos de duc_scraper hacia nuevas_entradas
-- =====================================================

-- 1. Crear configuración de filtro básica (procesa todos los vehículos)
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
    'Procesamiento Automático General',
    'Configuración que procesa automáticamente todos los vehículos de duc_scraper hacia nuevas_entradas',
    true,  -- is_active
    true,  -- auto_process
    1000,  -- max_vehicles_per_batch (alto para procesar muchos)
    NULL,  -- disponibilidad_filter (NULL = todos)
    NULL,  -- marca_filter (NULL = todas las marcas)
    NULL,  -- precio_min (NULL = sin límite mínimo)
    NULL,  -- precio_max (NULL = sin límite máximo)
    NULL,  -- km_min (NULL = sin límite mínimo)
    NULL,  -- km_max (NULL = sin límite máximo)
    NULL,  -- libre_siniestros (NULL = todos)
    NULL,  -- concesionario_filter (NULL = todos los concesionarios)
    NULL,  -- combustible_filter (NULL = todos los combustibles)
    NULL,  -- año_min (NULL = sin límite mínimo)
    NULL,  -- año_max (NULL = sin límite máximo)
    NULL,  -- dias_stock_min (NULL = sin límite mínimo)
    NULL   -- dias_stock_max (NULL = sin límite máximo)
) ON CONFLICT (name) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    auto_process = EXCLUDED.auto_process,
    updated_at = NOW();

-- 2. Crear configuración específica para BMW (ejemplo)
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
    'BMW Automático',
    'Configuración específica para procesar automáticamente vehículos BMW',
    true,  -- is_active
    true,  -- auto_process
    500,   -- max_vehicles_per_batch
    ARRAY['Disponible'],  -- solo disponibles
    ARRAY['BMW'],         -- solo BMW
    10000, -- precio mínimo 10.000€
    100000, -- precio máximo 100.000€
    0,     -- km mínimo 0
    100000, -- km máximo 100.000
    true,  -- solo libre de siniestros
    NULL,  -- todos los concesionarios
    NULL,  -- todos los combustibles
    2015,  -- año mínimo 2015
    2024,  -- año máximo 2024
    0,     -- días stock mínimo 0
    365    -- días stock máximo 365
) ON CONFLICT (name) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    auto_process = EXCLUDED.auto_process,
    updated_at = NOW();

-- 3. Verificar que se crearon correctamente
SELECT '=== CONFIGURACIONES CREADAS ===' as info;

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
    created_at
FROM filter_configs 
WHERE name IN ('Procesamiento Automático General', 'BMW Automático')
ORDER BY created_at DESC;

-- 4. Verificar configuraciones activas con auto_process
SELECT '=== CONFIGURACIONES ACTIVAS CON AUTO_PROCESS ===' as info;

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

-- 5. Procesar manualmente la configuración general para probar
SELECT '=== PROCESAMIENTO MANUAL DE PRUEBA ===' as info;

-- Nota: Este comando ejecuta el procesamiento manual
-- SELECT process_filter_config_trigger((SELECT id FROM filter_configs WHERE name = 'Procesamiento Automático General' LIMIT 1));

-- 6. Verificar el estado después de la creación
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
        WHEN configs_activas_auto > 0 THEN '✅ OK - El sistema está listo para procesar automáticamente'
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
        WHEN registros_duc > 0 THEN '✅ OK - Hay datos para procesar'
        ELSE '❌ PROBLEMA: No hay datos en duc_scraper'
    END as estado
FROM summary
UNION ALL
SELECT 
    'REGISTROS EN NUEVAS_ENTRADAS' as item,
    registros_nuevas_entradas as valor,
    'ℹ️ INFO - Registros actuales en nuevas_entradas' as estado
FROM summary; 