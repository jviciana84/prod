-- =====================================================
-- VERIFICACIÓN DE TABLA VEHICLE_SALE_STATUS (NO RETAIL)
-- =====================================================

-- 1. VERIFICAR ESTRUCTURA DE LA TABLA
SELECT 
    'ESTRUCTURA VEHICLE_SALE_STATUS' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicle_sale_status'
ORDER BY ordinal_position;

-- 2. VERIFICAR TOTAL DE REGISTROS
SELECT 
    'TOTAL REGISTROS' as info,
    COUNT(*) as total_registros
FROM vehicle_sale_status;

-- 3. VERIFICAR REGISTROS DE MUESTRA
SELECT 
    'MUESTRA DE REGISTROS' as info,
    *
FROM vehicle_sale_status
LIMIT 5;

-- 4. VERIFICAR SI HAY REGISTROS CON SALE_TYPE = 'professional'
SELECT 
    'REGISTROS PROFESIONALES' as info,
    COUNT(*) as total_profesionales
FROM vehicle_sale_status
WHERE sale_type = 'professional';

-- 5. VERIFICAR TODOS LOS TIPOS DE VENTA
SELECT 
    'TIPOS DE VENTA' as info,
    sale_type,
    COUNT(*) as cantidad
FROM vehicle_sale_status
GROUP BY sale_type
ORDER BY sale_type; 