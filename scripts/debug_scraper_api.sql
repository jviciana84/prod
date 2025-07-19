-- =====================================================
-- DIAGNÓSTICO DEL SCRAPER - POR QUÉ NO GUARDA EN DUC_SCRAPER
-- =====================================================
-- Verificar por qué el scraper no está guardando datos
-- =====================================================

-- 1. Verificar datos históricos
SELECT '=== DATOS HISTÓRICOS ===' as info;

SELECT 
    COUNT(*) as total_registros,
    MIN(created_at) as primer_registro,
    MAX(created_at) as ultimo_registro,
    COUNT(DISTINCT DATE(created_at)) as dias_con_datos
FROM duc_scraper;

-- 2. Verificar registros por fecha
SELECT '=== REGISTROS POR FECHA ===' as info;

SELECT 
    DATE(created_at) as fecha,
    COUNT(*) as registros
FROM duc_scraper 
GROUP BY DATE(created_at)
ORDER BY fecha DESC
LIMIT 10;

-- 3. Verificar estructura de duc_scraper
SELECT '=== ESTRUCTURA DE DUC_SCRAPER ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'duc_scraper'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar permisos de la tabla
SELECT '=== PERMISOS DE LA TABLA ===' as info;

SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'duc_scraper'
AND table_schema = 'public';

-- 5. Verificar si hay triggers que puedan estar interfiriendo
SELECT '=== TRIGGERS EN DUC_SCRAPER ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper';

-- 6. Verificar configuración de la API
SELECT '=== CONFIGURACIÓN DE LA API ===' as info;

-- Verificar si hay alguna configuración específica
SELECT 
    'Verificar archivo: app/api/import-csv/route.ts' as config_file,
    'Verificar que la API esté funcionando en http://localhost:3000/api/import-csv' as endpoint;

-- 7. Verificar logs de errores recientes
SELECT '=== LOGS DE ERRORES ===' as info;

-- Verificar si hay algún log de error en la base de datos
SELECT 
    'No hay tabla de logs de errores específica' as info,
    'Verificar logs del servidor Next.js' as recomendacion;

-- 8. Estado actual
SELECT '=== ESTADO ACTUAL ===' as info;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM duc_scraper) = 0 THEN '❌ PROBLEMA: duc_scraper vacía'
        ELSE '✅ OK: Hay datos en duc_scraper'
    END as estado_duc_scraper,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM filter_configs WHERE is_active = true AND auto_process = true) > 0 THEN '✅ OK: Configuración activa'
        ELSE '❌ PROBLEMA: No hay configuración activa'
    END as estado_configuracion,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM column_mappings WHERE is_active = true AND duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')) >= 3 THEN '✅ OK: Mapeos activos'
        ELSE '❌ PROBLEMA: Faltan mapeos'
    END as estado_mapeos;

-- 9. Instrucciones de diagnóstico
SELECT '=== INSTRUCCIONES DE DIAGNÓSTICO ===' as info;

SELECT 
    '1. Verificar que el servidor Next.js esté ejecutándose' as paso,
    '2. Verificar que la API /api/import-csv responda' as paso,
    '3. Verificar logs del scraper durante la ejecución' as paso,
    '4. Verificar logs del servidor Next.js' as paso,
    '5. Probar la API manualmente con un CSV pequeño' as paso; 