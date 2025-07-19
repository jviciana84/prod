-- =====================================================
-- VERIFICAR DATOS EN DUC_SCRAPER Y FLUJO AUTOMÁTICO
-- =====================================================

-- 1. Verificar datos en duc_scraper
SELECT '=== DATOS EN DUC_SCRAPER ===' as info;
SELECT 
    COUNT(*) as total_registros,
    MAX(import_date) as ultima_importacion
FROM duc_scraper;

-- 2. Verificar datos recientes
SELECT '=== DATOS RECIENTES ===' as info;
SELECT 
    id,
    "ID Anuncio",
    "Matrícula",
    "Modelo",
    "Marca",
    "Fecha compra DMS",
    file_name,
    import_date
FROM duc_scraper 
ORDER BY import_date DESC 
LIMIT 5;

-- 3. Verificar configuraciones de filtros activas
SELECT '=== CONFIGURACIONES DE FILTROS ===' as info;
SELECT 
    id,
    name,
    description,
    is_active,
    auto_process,
    created_at
FROM filter_configs 
WHERE is_active = true;

-- 4. Verificar mapeos de columnas activos
SELECT '=== MAPEOS DE COLUMNAS ===' as info;
SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE is_active = true;

-- 5. Verificar datos en nuevas_entradas
SELECT '=== DATOS EN NUEVAS_ENTRADAS ===' as info;
SELECT 
    COUNT(*) as total_registros,
    MAX(created_at) as ultima_entrada
FROM nuevas_entradas;

-- 6. Verificar logs de procesamiento
SELECT '=== LOGS DE PROCESAMIENTO ===' as info;
SELECT 
    id,
    filter_config_id,
    processed_by,
    created_at,
    summary
FROM filter_processing_log 
ORDER BY created_at DESC 
LIMIT 5; 