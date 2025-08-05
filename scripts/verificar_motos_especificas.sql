-- Script para verificar los datos específicos de las motos 2652MLW y 4683MCB
-- Este script nos ayudará a entender por qué no se están contabilizando correctamente

-- 1. Verificar si existen las motos en la tabla sales_vehicles
SELECT 
    id,
    license_plate,
    model,
    vehicle_type,
    sale_date,
    order_date,
    advisor,
    advisor_name,
    advisor_id,
    payment_method,
    price,
    created_at,
    updated_at
FROM sales_vehicles 
WHERE license_plate IN ('2652MLW', '4683MCB')
ORDER BY license_plate;

-- 2. Verificar todas las ventas del mes actual usando sale_date
SELECT 
    COUNT(*) as total_ventas_sale_date,
    COUNT(CASE WHEN vehicle_type ILIKE '%moto%' OR vehicle_type ILIKE '%motorcycle%' THEN 1 END) as motos_sale_date
FROM sales_vehicles 
WHERE sale_date >= DATE_TRUNC('month', CURRENT_DATE);

-- 3. Verificar todas las ventas del mes actual usando order_date
SELECT 
    COUNT(*) as total_ventas_order_date,
    COUNT(CASE WHEN vehicle_type ILIKE '%moto%' OR vehicle_type ILIKE '%motorcycle%' THEN 1 END) as motos_order_date
FROM sales_vehicles 
WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE);

-- 4. Verificar todas las ventas del mes actual (sin filtro de fecha)
SELECT 
    COUNT(*) as total_ventas_sin_filtro,
    COUNT(CASE WHEN vehicle_type ILIKE '%moto%' OR vehicle_type ILIKE '%motorcycle%' THEN 1 END) as motos_sin_filtro
FROM sales_vehicles;

-- 5. Verificar la estructura de la tabla sales_vehicles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles'
ORDER BY ordinal_position;

-- 6. Verificar todas las ventas del mes con detalles completos
SELECT 
    id,
    license_plate,
    model,
    vehicle_type,
    sale_date,
    order_date,
    advisor,
    advisor_name,
    advisor_id,
    payment_method,
    price,
    created_at,
    updated_at
FROM sales_vehicles 
WHERE sale_date >= DATE_TRUNC('month', CURRENT_DATE)
   OR order_date >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY COALESCE(order_date, sale_date) DESC; 