-- Script para debuggear las ventas de agosto y entender por qué solo aparece 1 moto
-- Este script simula exactamente la lógica del dashboard

-- 1. Verificar todas las ventas de agosto usando order_date (como hace el dashboard)
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
    brand,
    created_at,
    updated_at
FROM sales_vehicles 
WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY order_date;

-- 2. Contar total de ventas de agosto
SELECT 
    COUNT(*) as total_ventas_agosto
FROM sales_vehicles 
WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE);

-- 3. Contar motos de agosto (usando la misma lógica del dashboard)
SELECT 
    COUNT(*) as motos_agosto,
    COUNT(CASE WHEN vehicle_type = 'Moto' THEN 1 END) as motos_vehicle_type_exacto,
    COUNT(CASE WHEN vehicle_type ILIKE '%moto%' THEN 1 END) as motos_vehicle_type_contains,
    COUNT(CASE WHEN vehicle_type ILIKE '%motorcycle%' THEN 1 END) as motos_motorcycle
FROM sales_vehicles 
WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE);

-- 4. Mostrar todas las motos de agosto con detalles
SELECT 
    id,
    license_plate,
    model,
    vehicle_type,
    brand,
    order_date,
    price,
    payment_method
FROM sales_vehicles 
WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND (
    vehicle_type = 'Moto' OR
    vehicle_type ILIKE '%moto%' OR
    vehicle_type ILIKE '%motorcycle%' OR
    vehicle_type ILIKE '%motocicleta%' OR
    vehicle_type ILIKE '%scooter%' OR
    vehicle_type ILIKE '%ciclomotor%' OR
    vehicle_type ILIKE '%quad%' OR
    vehicle_type ILIKE '%bmw motorrad%' OR
    vehicle_type ILIKE '%motorrad%'
  )
ORDER BY order_date;

-- 5. Verificar si hay problemas con order_date NULL
SELECT 
    COUNT(*) as ventas_sin_order_date
FROM sales_vehicles 
WHERE order_date IS NULL 
  AND sale_date >= DATE_TRUNC('month', CURRENT_DATE);

-- 6. Verificar las dos motos específicas
SELECT 
    id,
    license_plate,
    model,
    vehicle_type,
    brand,
    sale_date,
    order_date,
    price,
    payment_method,
    CASE 
        WHEN order_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 'INCLUIDA_EN_AGOSTO'
        ELSE 'NO_INCLUIDA_EN_AGOSTO'
    END as estado_filtro_agosto
FROM sales_vehicles 
WHERE license_plate IN ('2652MLW', '4683MCB')
ORDER BY license_plate; 