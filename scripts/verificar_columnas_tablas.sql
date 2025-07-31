-- =====================================================
-- VERIFICAR COLUMNAS DE TABLAS
-- =====================================================

-- 1. COLUMNAS DE DUC_SCRAPER
SELECT 
    'DUC_SCRAPER' as tabla,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
ORDER BY ordinal_position;

-- 2. COLUMNAS DE STOCK
SELECT 
    'STOCK' as tabla,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'stock' 
ORDER BY ordinal_position;

-- 3. COLUMNAS DE FOTOS
SELECT 
    'FOTOS' as tabla,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'fotos' 
ORDER BY ordinal_position;

-- 4. COLUMNAS DE SALES_VEHICLES
SELECT 
    'SALES_VEHICLES' as tabla,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
ORDER BY ordinal_position;

-- 5. COLUMNAS DE NUEVAS_ENTRADAS
SELECT 
    'NUEVAS_ENTRADAS' as tabla,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas' 
ORDER BY ordinal_position; 