-- =====================================================
-- ARREGLAR VENTAS PREMATURAS EN FOTOS PENDIENTES
-- =====================================================

-- 1. VERIFICAR ESTADO ACTUAL DE VENTAS PREMATURAS
SELECT 
    'ESTADO ACTUAL VENTAS PREMATURAS' as info,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    f.photos_completed,
    f.estado_pintura,
    f.created_at as foto_created,
    sv.created_at as sale_created
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
WHERE f.license_plate IS NOT NULL
AND f.photos_completed = false
AND sv.created_at < f.created_at
ORDER BY sv.license_plate;

-- 2. ARREGLAR VEHÍCULOS VENDIDOS EN SALES_VEHICLES QUE ESTÁN PENDIENTES EN FOTOS
UPDATE fotos 
SET 
    estado_pintura = 'vendido',
    updated_at = NOW()
WHERE license_plate IN (
    SELECT sv.license_plate
    FROM sales_vehicles sv
    WHERE sv.license_plate IS NOT NULL
)
AND photos_completed = false
AND estado_pintura != 'vendido';

-- 3. ARREGLAR VEHÍCULOS VENDIDOS EN VEHICLE_SALE_STATUS QUE ESTÁN PENDIENTES EN FOTOS
UPDATE fotos 
SET 
    estado_pintura = 'vendido',
    updated_at = NOW()
WHERE license_plate IN (
    SELECT vss.license_plate
    FROM vehicle_sale_status vss
    WHERE vss.sale_status = 'vendido'
    AND vss.license_plate IS NOT NULL
)
AND photos_completed = false
AND estado_pintura != 'vendido';

-- 4. VERIFICAR CAMBIOS EN VENTAS PREMATURAS
SELECT 
    'ESTADO DESPUÉS DEL ARREGLO VENTAS PREMATURAS' as info,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    f.photos_completed,
    f.estado_pintura,
    f.updated_at
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
WHERE f.license_plate IS NOT NULL
AND sv.created_at < f.created_at
ORDER BY sv.license_plate;

-- 5. CONTAR VEHÍCULOS ARREGLADOS
SELECT 
    'TOTAL VEHÍCULOS ARREGLADOS' as info,
    COUNT(*) as total
FROM fotos 
WHERE license_plate IN (
    SELECT sv.license_plate
    FROM sales_vehicles sv
    WHERE sv.license_plate IS NOT NULL
)
AND estado_pintura = 'vendido'
AND photos_completed = false;

-- 6. VERIFICAR QUE NO QUEDEN VEHÍCULOS VENDIDOS EN FOTOS PENDIENTES
SELECT 
    'VERIFICACIÓN FINAL VENTAS PREMATURAS' as info,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    f.photos_completed,
    f.estado_pintura,
    CASE 
        WHEN f.estado_pintura = 'vendido' THEN 'CORRECTO'
        ELSE 'AÚN TIENE PROBLEMA'
    END as estado
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
WHERE f.license_plate IS NOT NULL
AND f.photos_completed = false
ORDER BY sv.license_plate;

-- 7. CONTAR VEHÍCULOS VENDIDOS QUE SIGUEN EN FOTOS PENDIENTES (DEBERÍA SER 0)
SELECT 
    'TOTAL VENDIDOS EN FOTOS PENDIENTES (DEBERÍA SER 0)' as info,
    COUNT(*) as total
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
WHERE f.license_plate IS NOT NULL
AND f.photos_completed = false
AND f.estado_pintura != 'vendido';

-- 8. VERIFICAR VEHÍCULOS EN VEHICLE_SALE_STATUS QUE SIGUEN PENDIENTES
SELECT 
    'VENDIDOS EN STATUS QUE SIGUEN PENDIENTES' as info,
    vss.license_plate,
    vss.sale_status,
    f.photos_completed,
    f.estado_pintura,
    CASE 
        WHEN f.estado_pintura = 'vendido' THEN 'CORRECTO'
        ELSE 'AÚN TIENE PROBLEMA'
    END as estado
FROM vehicle_sale_status vss
LEFT JOIN fotos f ON vss.license_plate = f.license_plate
WHERE vss.sale_status = 'vendido'
AND f.license_plate IS NOT NULL
AND f.photos_completed = false
ORDER BY vss.license_plate; 