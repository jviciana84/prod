-- =====================================================
-- VERIFICAR DATOS EN DUC_SCRAPER DESPUÉS DEL SCRAPING
-- =====================================================
-- Verificar si los datos se guardaron realmente
-- =====================================================

-- 1. Verificar datos actuales
SELECT '=== DATOS ACTUALES EN DUC_SCRAPER ===' as info;

SELECT 
    COUNT(*) as total_registros,
    MIN(created_at) as primer_registro,
    MAX(created_at) as ultimo_registro,
    COUNT(DISTINCT DATE(created_at)) as dias_con_datos
FROM duc_scraper;

-- 2. Verificar registros más recientes
SELECT '=== REGISTROS MÁS RECIENTES ===' as info;

SELECT 
    id,
    "ID Anuncio",
    "Matrícula",
    "Modelo",
    "Marca",
    "Precio",
    created_at,
    updated_at,
    file_name
FROM duc_scraper 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Verificar registros por archivo
SELECT '=== REGISTROS POR ARCHIVO ===' as info;

SELECT 
    file_name,
    COUNT(*) as registros,
    MIN(created_at) as primer_registro,
    MAX(created_at) as ultimo_registro
FROM duc_scraper 
GROUP BY file_name
ORDER BY MAX(created_at) DESC;

-- 4. Verificar si hay registros de hoy
SELECT '=== REGISTROS DE HOY ===' as info;

SELECT 
    COUNT(*) as registros_hoy,
    COUNT(DISTINCT "ID Anuncio") as anuncios_unicos_hoy
FROM duc_scraper 
WHERE DATE(created_at) = CURRENT_DATE;

-- 5. Verificar estructura de la tabla
SELECT '=== ESTRUCTURA DE DUC_SCRAPER ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'duc_scraper'
AND table_schema = 'public'
AND column_name IN ('id', 'created_at', 'updated_at', 'file_name', 'import_date', 'last_seen_date')
ORDER BY ordinal_position;

-- 6. Verificar permisos de inserción
SELECT '=== PERMISOS DE INSERCIÓN ===' as info;

SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'duc_scraper'
AND table_schema = 'public'
AND privilege_type IN ('INSERT', 'UPDATE', 'SELECT');

-- 7. Estado final
SELECT '=== ESTADO FINAL ===' as info;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM duc_scraper) > 0 THEN '✅ OK: Hay datos en duc_scraper'
        ELSE '❌ PROBLEMA: duc_scraper está vacía'
    END as estado_duc_scraper,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM duc_scraper WHERE DATE(created_at) = CURRENT_DATE) > 0 THEN '✅ OK: Hay datos de hoy'
        ELSE '❌ PROBLEMA: No hay datos de hoy'
    END as estado_datos_hoy,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM filter_configs WHERE is_active = true AND auto_process = true) > 0 THEN '✅ OK: Configuración activa'
        ELSE '❌ PROBLEMA: No hay configuración activa'
    END as estado_configuracion;

-- 8. Si no hay datos, verificar posibles causas
SELECT '=== POSIBLES CAUSAS SI NO HAY DATOS ===' as info;

SELECT 
    '1. Error en la API de inserción' as causa,
    'Verificar logs del servidor Next.js' as verificacion
WHERE (SELECT COUNT(*) FROM duc_scraper) = 0
UNION ALL
SELECT 
    '2. Problema de permisos en Supabase' as causa,
    'Verificar service role key y permisos' as verificacion
WHERE (SELECT COUNT(*) FROM duc_scraper) = 0
UNION ALL
SELECT 
    '3. Error en el trigger automático' as causa,
    'Verificar si el trigger está interfiriendo' as verificacion
WHERE (SELECT COUNT(*) FROM duc_scraper) = 0; 