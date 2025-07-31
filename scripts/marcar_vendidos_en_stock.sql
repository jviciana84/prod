-- =====================================================
-- MARCAR VEHÍCULOS VENDIDOS EN STOCK
-- =====================================================
-- Descripción: Marcar como vendidos los vehículos que están en sales_vehicles o vehicle_sale_status
-- =====================================================

-- 1. MARCAR VEHÍCULOS DE SALES_VEHICLES COMO VENDIDOS
UPDATE stock 
SET is_sold = true
WHERE license_plate IN (
    SELECT license_plate 
    FROM sales_vehicles
);

-- 2. MARCAR VEHÍCULOS DE VEHICLE_SALE_STATUS COMO VENDIDOS
UPDATE stock 
SET is_sold = true
WHERE license_plate IN (
    SELECT license_plate 
    FROM vehicle_sale_status 
    WHERE sale_status IN ('vendido', 'profesional', 'tactico_vn')
);

-- 3. VERIFICAR CUÁNTOS VEHÍCULOS SE MARCARON COMO VENDIDOS
SELECT 
    'TOTAL VENDIDOS EN STOCK' as info,
    COUNT(*) as total
FROM stock 
WHERE is_sold = true;

-- 4. MOSTRAR VEHÍCULOS VENDIDOS
SELECT 
    'VEHÍCULOS VENDIDOS' as info,
    license_plate,
    model,
    reception_date,
    is_sold
FROM stock 
WHERE is_sold = true
ORDER BY reception_date DESC;

-- 5. VERIFICAR QUE 6749LTB ESTÁ MARCADO COMO VENDIDO
SELECT 
    'BUSCANDO 6749LTB' as info,
    license_plate,
    model,
    reception_date,
    is_sold
FROM stock 
WHERE license_plate = '6749LTB'; 