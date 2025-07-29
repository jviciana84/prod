-- =====================================================
-- DEBUG: VERIFICAR VENTAS MIGRADAS
-- =====================================================

-- 1. VERIFICAR VEHICLE_SALE_STATUS
SELECT 
    'VEHICLE_SALE_STATUS' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN sale_status = 'vendido' THEN 1 END) as vendidos,
    COUNT(CASE WHEN sale_status = 'profesional' THEN 1 END) as profesionales,
    COUNT(CASE WHEN sale_status = 'tactico_vn' THEN 1 END) as tacticos_vn,
    COUNT(CASE WHEN sale_status = 'entregado' THEN 1 END) as entregados
FROM vehicle_sale_status;

-- 2. VERIFICAR SALES_VEHICLES
SELECT 
    'SALES_VEHICLES' as tabla,
    COUNT(*) as total_ventas
FROM sales_vehicles;

-- 3. VERIFICAR STOCK
SELECT 
    'STOCK' as tabla,
    COUNT(*) as total_vehiculos
FROM stock;

-- 4. COMPARAR VENTAS CON VEHICLE_SALE_STATUS
SELECT 
    'COMPARACIÓN' as tipo,
    COUNT(sv.id) as ventas_en_sales_vehicles,
    COUNT(vss.vehicle_id) as ventas_en_vehicle_sale_status,
    COUNT(CASE WHEN vss.sale_status = 'vendido' THEN 1 END) as marcados_como_vendido
FROM sales_vehicles sv
LEFT JOIN vehicle_sale_status vss ON sv.license_plate = vss.license_plate;

-- 5. LISTAR PRIMEROS 10 VEHÍCULOS VENDIDOS
SELECT 
    'PRIMEROS 10 VENDIDOS' as tipo,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    vss.sale_status,
    vss.notes
FROM sales_vehicles sv
LEFT JOIN vehicle_sale_status vss ON sv.license_plate = vss.license_plate
ORDER BY sv.sale_date DESC
LIMIT 10;

-- 6. VERIFICAR SI HAY VEHÍCULOS EN STOCK QUE DEBERÍAN ESTAR VENDIDOS
SELECT 
    'ERROR: VENDIDOS EN STOCK' as problema,
    s.license_plate,
    s.model,
    sv.sale_date
FROM stock s
INNER JOIN sales_vehicles sv ON s.license_plate = sv.license_plate
ORDER BY sv.sale_date DESC; 