-- =====================================================
-- REVISIÓN COMPLETA DE ESTRUCTURAS DEL SISTEMA
-- =====================================================

-- 1. ESTRUCTURA DE NUEVAS_ENTRADAS
SELECT 
    'NUEVAS_ENTRADAS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'nuevas_entradas'
ORDER BY ordinal_position;

-- 2. ESTRUCTURA DE STOCK
SELECT 
    'STOCK' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stock'
ORDER BY ordinal_position;

-- 3. ESTRUCTURA DE SALES_VEHICLES
SELECT 
    'SALES_VEHICLES' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_vehicles'
ORDER BY ordinal_position;

-- 4. ESTRUCTURA DE PEDIDOS_VALIDADOS
SELECT 
    'PEDIDOS_VALIDADOS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pedidos_validados'
ORDER BY ordinal_position;

-- 5. ESTRUCTURA DE ENTREGAS
SELECT 
    'ENTREGAS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'entregas'
ORDER BY ordinal_position;

-- 6. ESTRUCTURA DE VEHICLE_SALE_STATUS
SELECT 
    'VEHICLE_SALE_STATUS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'vehicle_sale_status'
ORDER BY ordinal_position;

-- 7. ESTRUCTURA DE FOTOS
SELECT 
    'FOTOS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'fotos'
ORDER BY ordinal_position;

-- 8. ESTRUCTURA DE DUC_SCRAPER
SELECT 
    'DUC_SCRAPER' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'duc_scraper'
ORDER BY ordinal_position;

-- 9. RELACIONES ACTUALES (CONSTRAINTS)
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN (
    'nuevas_entradas',
    'stock', 
    'sales_vehicles',
    'pedidos_validados',
    'entregas',
    'vehicle_sale_status',
    'fotos',
    'duc_scraper'
)
ORDER BY tc.table_name, tc.constraint_type;

-- 10. ÍNDICES ACTUALES
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'nuevas_entradas',
    'stock', 
    'sales_vehicles',
    'pedidos_validados',
    'entregas',
    'vehicle_sale_status',
    'fotos',
    'duc_scraper'
)
ORDER BY tablename, indexname; 