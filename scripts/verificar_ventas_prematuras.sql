-- Script para verificar ventas prematuras
-- Verificar estructura de la tabla sales_vehicles
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles'
ORDER BY ordinal_position;

-- Verificar total de registros en sales_vehicles
SELECT 
    COUNT(*) as total_registros
FROM sales_vehicles;

-- Verificar registros con ventas prematuras
SELECT 
    license_plate,
    sold_before_body_ready,
    sold_before_photos_ready,
    CASE 
        WHEN sold_before_body_ready = true OR sold_before_photos_ready = true 
        THEN 'VENTA PREMATURA'
        ELSE 'VENTA NORMAL'
    END as tipo_venta
FROM sales_vehicles
WHERE sold_before_body_ready = true OR sold_before_photos_ready = true;

-- Contar total de ventas prematuras
SELECT 
    COUNT(*) as total_ventas_prematuras
FROM sales_vehicles
WHERE sold_before_body_ready = true OR sold_before_photos_ready = true;

-- Verificar si las matrículas de ventas prematuras existen en stock
SELECT 
    sv.license_plate,
    sv.sold_before_body_ready,
    sv.sold_before_photos_ready,
    CASE 
        WHEN s.license_plate IS NOT NULL THEN 'EN STOCK'
        ELSE 'NO EN STOCK'
    END as en_stock
FROM sales_vehicles sv
LEFT JOIN stock s ON sv.license_plate = s.license_plate
WHERE sv.sold_before_body_ready = true OR sv.sold_before_photos_ready = true;

-- Contar cuántas ventas prematuras están en stock
SELECT 
    COUNT(*) as ventas_prematuras_en_stock
FROM sales_vehicles sv
INNER JOIN stock s ON sv.license_plate = s.license_plate
WHERE sv.sold_before_body_ready = true OR sv.sold_before_photos_ready = true; 