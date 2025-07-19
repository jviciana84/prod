-- =====================================================
-- VERIFICAR CONEXIÓN DEL SCRAPER
-- =====================================================
-- Verificar si el scraper está funcionando
-- =====================================================

-- 1. Verificar si hay datos en duc_scraper
SELECT '=== DATOS EN DUC_SCRAPER ===' as info;

SELECT 
    COUNT(*) as total_registros,
    MIN(created_at) as primer_registro,
    MAX(created_at) as ultimo_registro
FROM duc_scraper;

-- 2. Verificar estructura de duc_scraper
SELECT '=== ESTRUCTURA DE DUC_SCRAPER ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'duc_scraper'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar si hay algún registro de prueba
SELECT '=== REGISTROS DE PRUEBA ===' as info;

SELECT 
    id,
    "Matrícula",
    "Modelo",
    "Fecha compra DMS",
    created_at,
    updated_at
FROM duc_scraper 
LIMIT 5;

-- 4. Verificar configuración del scraper
SELECT '=== CONFIGURACIÓN DEL SCRAPER ===' as info;

-- Verificar si hay alguna configuración específica para el scraper
SELECT 
    'No hay configuración específica del scraper en la base de datos' as info;

-- 5. Verificar logs de importación
SELECT '=== LOGS DE IMPORTACIÓN ===' as info;

-- Verificar si hay algún log de importación de CSV
SELECT 
    'No hay tabla de logs de importación específica' as info;

-- 6. Estado del sistema
SELECT '=== ESTADO DEL SISTEMA ===' as info;

SELECT 
    'duc_scraper vacía' as problema,
    'El scraper no está guardando datos o no se está ejecutando' as causa_posible,
    'Verificar: 1) Scraper ejecutándose, 2) Conexión a API, 3) Permisos de escritura' as solucion;

-- 7. Instrucciones para el usuario
SELECT '=== INSTRUCCIONES ===' as info;

SELECT 
    '1. Ejecuta el scraper manualmente' as paso,
    '2. Verifica que se conecte a la API /api/import-csv' as paso,
    '3. Revisa los logs del scraper' as paso,
    '4. Verifica que los datos se guarden en duc_scraper' as paso; 