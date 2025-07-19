-- =====================================================
-- DIAGNÓSTICO: ESTRUCTURA DE DUC_SCRAPER
-- =====================================================
-- Verificar qué columnas están llegando del CSV

-- 1. Ver estructura de la tabla duc_scraper
SELECT '=== ESTRUCTURA DE DUC_SCRAPER ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
ORDER BY ordinal_position;

-- 2. Ver si hay datos en duc_scraper
SELECT '=== DATOS EN DUC_SCRAPER ===' as info;
SELECT COUNT(*) as total_registros FROM duc_scraper;

-- 3. Si hay datos, mostrar las primeras filas con columnas clave
SELECT '=== MUESTRA DE DATOS ===' as info;
SELECT 
    "ID Anuncio",
    "Matrícula", 
    "Modelo",
    "Marca",
    "Precio",
    "Fecha compra DMS",
    "Concesionario",
    "Días stock",
    file_name,
    import_date
FROM duc_scraper 
ORDER BY import_date DESC 
LIMIT 5;

-- 4. Verificar columnas específicas que necesitamos
SELECT '=== VERIFICACIÓN DE COLUMNAS CLAVE ===' as info;
SELECT 
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status,
    'Matrícula' as columna,
    COUNT(*) as registros_con_dato
FROM duc_scraper 
WHERE "Matrícula" IS NOT NULL AND "Matrícula" != ''

UNION ALL

SELECT 
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status,
    'Modelo' as columna,
    COUNT(*) as registros_con_dato
FROM duc_scraper 
WHERE "Modelo" IS NOT NULL AND "Modelo" != ''

UNION ALL

SELECT 
    CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status,
    'Fecha compra DMS' as columna,
    COUNT(*) as registros_con_dato
FROM duc_scraper 
WHERE "Fecha compra DMS" IS NOT NULL AND "Fecha compra DMS" != '';

-- 5. Verificar si hay datos recientes
SELECT '=== DATOS RECIENTES ===' as info;
SELECT 
    COUNT(*) as registros_hoy,
    MAX(import_date) as ultima_importacion
FROM duc_scraper 
WHERE DATE(import_date) = CURRENT_DATE; 