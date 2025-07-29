-- =====================================================
-- TEST SIMPLE: VERIFICAR DATOS PARA FRONTEND
-- =====================================================

-- 1. VERIFICAR QUE SALES_VEHICLES TIENE DATOS
SELECT 
    'SALES_VEHICLES COUNT' as tipo,
    COUNT(*) as total
FROM sales_vehicles;

-- 2. VERIFICAR QUE VEHICLE_SALE_STATUS TIENE VENDIDOS
SELECT 
    'VEHICLE_SALE_STATUS VENDIDOS' as tipo,
    COUNT(*) as total_vendidos
FROM vehicle_sale_status 
WHERE sale_status = 'vendido';

-- 3. LISTAR 5 VEHÍCULOS VENDIDOS PARA VERIFICAR
SELECT 
    'TEST FRONTEND' as tipo,
    sv.id,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    vss.sale_status
FROM sales_vehicles sv
LEFT JOIN vehicle_sale_status vss ON sv.license_plate = vss.license_plate
WHERE vss.sale_status = 'vendido'
ORDER BY sv.sale_date DESC
LIMIT 5; 