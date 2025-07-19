-- =====================================================
-- VERIFICAR SI SE INSERTARON LOS DATOS DE PRUEBA
-- =====================================================

-- 1. Verificar datos de prueba
SELECT '=== DATOS DE PRUEBA ===' as info;
SELECT 
    id,
    "ID Anuncio",
    "Matrícula",
    "Modelo",
    "Marca",
    file_name,
    import_date
FROM duc_scraper 
WHERE "ID Anuncio" = 'TEST-123' OR "Matrícula" = '9999ZZZ'
ORDER BY import_date DESC;

-- 2. Verificar datos de hoy
SELECT '=== DATOS DE HOY ===' as info;
SELECT 
    COUNT(*) as total_registros_hoy,
    MAX(import_date) as ultima_importacion
FROM duc_scraper 
WHERE DATE(import_date) = CURRENT_DATE;

-- 3. Verificar últimos 10 registros
SELECT '=== ÚLTIMOS 10 REGISTROS ===' as info;
SELECT 
    id,
    "ID Anuncio",
    "Matrícula",
    "Modelo",
    "Marca",
    file_name,
    import_date
FROM duc_scraper 
ORDER BY import_date DESC 
LIMIT 10; 