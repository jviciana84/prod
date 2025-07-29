-- =====================================================
-- REVISAR COLUMNAS DE TABLAS PRINCIPALES
-- =====================================================

-- 1. NUEVAS_ENTRADAS
SELECT 
    'NUEVAS_ENTRADAS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'nuevas_entradas'
ORDER BY ordinal_position;

-- 2. STOCK
SELECT 
    'STOCK' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stock'
ORDER BY ordinal_position;

-- 3. SALES_VEHICLES
SELECT 
    'SALES_VEHICLES' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_vehicles'
ORDER BY ordinal_position;

-- 4. PEDIDOS_VALIDADOS
SELECT 
    'PEDIDOS_VALIDADOS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pedidos_validados'
ORDER BY ordinal_position;

-- 5. ENTREGAS
SELECT 
    'ENTREGAS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'entregas'
ORDER BY ordinal_position;

-- 6. VEHICLE_SALE_STATUS
SELECT 
    'VEHICLE_SALE_STATUS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'vehicle_sale_status'
ORDER BY ordinal_position; 