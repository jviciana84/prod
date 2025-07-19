-- =====================================================
-- CREAR MAPEO FALTANTE
-- =====================================================
-- Identificar y crear el mapeo básico que falta
-- =====================================================

-- 1. Ver qué mapeos básicos tenemos actualmente
SELECT '=== MAPEOS BÁSICOS ACTUALES ===' as info;

SELECT 
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')
ORDER BY duc_scraper_column;

-- 2. Identificar cuál falta
SELECT '=== IDENTIFICAR MAPEO FALTANTE ===' as info;

SELECT 
    'Matrícula' as duc_column,
    'license_plate' as nuevas_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM column_mappings WHERE duc_scraper_column = 'Matrícula' AND nuevas_entradas_column = 'license_plate') 
        THEN '✅ EXISTE' 
        ELSE '❌ FALTA - CREAR' 
    END as estado
UNION ALL
SELECT 
    'Modelo' as duc_column,
    'model' as nuevas_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM column_mappings WHERE duc_scraper_column = 'Modelo' AND nuevas_entradas_column = 'model') 
        THEN '✅ EXISTE' 
        ELSE '❌ FALTA - CREAR' 
    END as estado
UNION ALL
SELECT 
    'Fecha compra DMS' as duc_column,
    'purchase_date' as nuevas_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM column_mappings WHERE duc_scraper_column = 'Fecha compra DMS' AND nuevas_entradas_column = 'purchase_date') 
        THEN '✅ EXISTE' 
        ELSE '❌ FALTA - CREAR' 
    END as estado;

-- 3. Crear el mapeo faltante (solo si no existe)
INSERT INTO column_mappings (
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active,
    created_at,
    updated_at
)
SELECT 
    'Mapeo ' || duc_col || ' a ' || nuevas_col as name,
    duc_col as duc_scraper_column,
    nuevas_col as nuevas_entradas_column,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM (
    VALUES 
        ('Matrícula', 'license_plate'),
        ('Modelo', 'model'),
        ('Fecha compra DMS', 'purchase_date')
) AS v(duc_col, nuevas_col)
WHERE NOT EXISTS (
    SELECT 1 FROM column_mappings 
    WHERE duc_scraper_column = v.duc_col 
    AND nuevas_entradas_column = v.nuevas_col
);

-- 4. Verificar todos los mapeos después de la creación
SELECT '=== MAPEOS BÁSICOS DESPUÉS DE LA CREACIÓN ===' as info;

SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active,
    created_at
FROM column_mappings 
WHERE duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')
ORDER BY duc_scraper_column;

-- 5. Estado final
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

-- 6. Si todo está OK, probar el sistema
SELECT '=== SISTEMA LISTO PARA CAPTURA AUTOMÁTICA ===' as info;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM filter_configs WHERE is_active = true AND auto_process = true) > 0
        AND (SELECT COUNT(*) FROM column_mappings WHERE is_active = true AND duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')) >= 3
        AND (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'duc_scraper' AND trigger_name = 'trigger_auto_process_filters') > 0
        THEN '🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!'
        ELSE '⚠️ Aún faltan componentes'
    END as estado_sistema; 