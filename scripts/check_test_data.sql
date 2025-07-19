-- =====================================================
-- VERIFICAR DATOS DE PRUEBA INSERTADOS
-- =====================================================

-- 1. Verificar si hay datos de prueba
SELECT '=== DATOS DE PRUEBA ===' as info;
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
WHERE "ID Anuncio" LIKE 'BMW-%' OR "ID Anuncio" LIKE 'TEST-%'
ORDER BY import_date DESC;

-- 2. Verificar datos recientes
SELECT '=== DATOS RECIENTES ===' as info;
SELECT 
    COUNT(*) as total_registros_hoy,
    MAX(import_date) as ultima_importacion
FROM duc_scraper 
WHERE DATE(import_date) = CURRENT_DATE;

-- 3. Verificar estructura de la tabla
SELECT '=== ESTRUCTURA DUC_SCRAPER ===' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND column_name IN ('ID Anuncio', 'Matrícula', 'Modelo', 'Marca', 'Precio')
ORDER BY ordinal_position; 