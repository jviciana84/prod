-- =====================================================
-- VER TUS FILTROS CONFIGURADOS (SOLO DIAGNÓSTICO)
-- =====================================================

-- 1. Ver qué filtros tienes configurados
SELECT '=== TUS FILTROS CONFIGURADOS ===' as info;
SELECT 
    id,
    name,
    description,
    is_active,
    auto_process,
    created_at
FROM filter_configs 
WHERE is_active = true AND auto_process = true;

-- 2. Ver qué mapeos de columnas tienes activos
SELECT '=== TUS MAPEOS DE COLUMNAS ===' as info;
SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE is_active = true;

-- 3. Ver qué columnas tienes en duc_scraper
SELECT '=== COLUMNAS EN DUC_SCRAPER ===' as info;
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
ORDER BY ordinal_position;

-- 4. Ver datos de ejemplo para entender filtros
SELECT '=== DATOS DE EJEMPLO ===' as info;
SELECT 
    "Marca",
    "Disponibilidad",
    "Estado",
    COUNT(*) as cantidad
FROM duc_scraper 
GROUP BY "Marca", "Disponibilidad", "Estado"
ORDER BY cantidad DESC
LIMIT 10; 