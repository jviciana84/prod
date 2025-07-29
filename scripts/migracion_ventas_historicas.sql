-- =====================================================
-- MIGRACIÓN DE VENTAS HISTÓRICAS
-- =====================================================

-- 1. INSERTAR VEHÍCULOS VENDIDOS EN VEHICLE_SALE_STATUS
INSERT INTO vehicle_sale_status (vehicle_id, source_table, license_plate, sale_status, created_at, notes)
SELECT 
    sv.id as vehicle_id,
    'sales_vehicles' as source_table,
    sv.license_plate,
    'vendido' as sale_status,
    sv.sale_date as created_at,
    'Migración histórica - vendido antes del sistema de control' as notes
FROM sales_vehicles sv
LEFT JOIN vehicle_sale_status vss ON sv.license_plate = vss.license_plate AND vss.sale_status = 'vendido'
WHERE vss.license_plate IS NULL
ORDER BY sv.sale_date DESC;

-- 2. ELIMINAR VEHÍCULOS VENDIDOS DE STOCK
DELETE FROM stock 
WHERE license_plate IN (
    SELECT DISTINCT sv.license_plate 
    FROM sales_vehicles sv
    WHERE sv.license_plate IS NOT NULL
);

-- 3. GESTIONAR FOTOS DE VEHÍCULOS VENDIDOS
-- 3.1. Vehículos vendidos SIN fotos - NO hacer nada, quedan como "vendido sin fotos"
-- (No se agregan a fotos pendientes porque ya están vendidos)

-- 3.2. Vehículos vendidos CON fotos - mantener estado actual
-- (No hacer nada, mantener photos_completed como esté)

-- 4. VERIFICAR RESULTADO
SELECT 
    'RESULTADO MIGRACIÓN' as tipo,
    COUNT(*) as total_vehiculos_vendidos,
    'Migrados a vehicle_sale_status' as descripcion
FROM vehicle_sale_status 
WHERE sale_status = 'vendido' 
AND notes LIKE '%Migración histórica%';

-- 5. VERIFICAR STOCK LIMPIO
SELECT 
    'VERIFICACIÓN STOCK' as tipo,
    COUNT(*) as vehiculos_en_stock,
    'Deberían ser solo disponibles' as descripcion
FROM stock;

-- 6. VERIFICAR FOTOS DE VEHÍCULOS VENDIDOS
SELECT 
    'VERIFICACIÓN FOTOS' as tipo,
    COUNT(*) as vehiculos_vendidos_sin_fotos,
    'Vendidos sin fotos - estado correcto' as descripcion
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
WHERE f.license_plate IS NULL
AND sv.license_plate IS NOT NULL;

-- 7. LISTAR VEHÍCULOS MIGRADOS
SELECT 
    'VEHÍCULOS MIGRADOS' as tipo,
    license_plate,
    sale_status,
    created_at,
    notes
FROM vehicle_sale_status 
WHERE notes LIKE '%Migración histórica%'
ORDER BY created_at DESC; 