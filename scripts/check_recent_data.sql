-- =====================================================
-- VERIFICAR DATOS RECIENTES EN DUC_SCRAPER
-- =====================================================

-- 1. Verificar si hay datos hoy
SELECT '=== DATOS DE HOY ===' as info;
SELECT 
    COUNT(*) as total_registros_hoy,
    MAX(import_date) as ultima_importacion
FROM duc_scraper 
WHERE DATE(import_date) = CURRENT_DATE;

-- 2. Verificar datos de las últimas 24 horas
SELECT '=== DATOS ÚLTIMAS 24 HORAS ===' as info;
SELECT 
    COUNT(*) as total_registros_24h,
    MAX(import_date) as ultima_importacion
FROM duc_scraper 
WHERE import_date >= NOW() - INTERVAL '24 hours';

-- 3. Mostrar los últimos 5 registros
SELECT '=== ÚLTIMOS 5 REGISTROS ===' as info;
SELECT 
    id,
    "ID Anuncio",
    "Matrícula",
    "Modelo", 
    "Marca",
    "Precio",
    file_name,
    import_date
FROM duc_scraper 
ORDER BY import_date DESC 
LIMIT 5;

-- 4. Verificar columnas clave
SELECT '=== VERIFICACIÓN COLUMNAS CLAVE ===' as info;
SELECT 
    'Matrícula' as columna,
    COUNT(*) as registros_con_dato,
    COUNT(CASE WHEN "Matrícula" != '' THEN 1 END) as registros_no_vacios
FROM duc_scraper 
WHERE DATE(import_date) = CURRENT_DATE

UNION ALL

SELECT 
    'Modelo' as columna,
    COUNT(*) as registros_con_dato,
    COUNT(CASE WHEN "Modelo" != '' THEN 1 END) as registros_no_vacios
FROM duc_scraper 
WHERE DATE(import_date) = CURRENT_DATE

UNION ALL

SELECT 
    'Fecha compra DMS' as columna,
    COUNT(*) as registros_con_dato,
    COUNT(CASE WHEN "Fecha compra DMS" != '' THEN 1 END) as registros_no_vacios
FROM duc_scraper 
WHERE DATE(import_date) = CURRENT_DATE; 