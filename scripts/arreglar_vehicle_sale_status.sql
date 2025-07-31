-- =====================================================
-- ARREGLAR VEHÍCULOS EN VEHICLE_SALE_STATUS VENDIDOS PERO PENDIENTES EN FOTOS
-- =====================================================

-- 1. VERIFICAR ESTADO ACTUAL DE VEHÍCULOS EN VEHICLE_SALE_STATUS
SELECT 
    'ESTADO ACTUAL VEHICLE_SALE_STATUS' as info,
    vss.license_plate,
    vss.sale_status,
    vss.created_at as status_created,
    f.photos_completed,
    f.estado_pintura,
    f.created_at as foto_created
FROM vehicle_sale_status vss
LEFT JOIN fotos f ON vss.license_plate = f.license_plate
WHERE vss.sale_status = 'vendido'
AND f.license_plate IS NOT NULL
AND f.photos_completed = false
ORDER BY vss.license_plate;

-- 2. CONTAR CUÁNTOS VEHÍCULOS TIENEN ESTE PROBLEMA
SELECT 
    'TOTAL VEHÍCULOS CON PROBLEMA' as info,
    COUNT(*) as total
FROM vehicle_sale_status vss
LEFT JOIN fotos f ON vss.license_plate = f.license_plate
WHERE vss.sale_status = 'vendido'
AND f.license_plate IS NOT NULL
AND f.photos_completed = false;

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

-- 4. VERIFICAR CAMBIOS APLICADOS
SELECT 
    'ESTADO DESPUÉS DEL ARREGLO' as info,
    vss.license_plate,
    vss.sale_status,
    vss.created_at as status_created,
    f.photos_completed,
    f.estado_pintura,
    f.updated_at
FROM vehicle_sale_status vss
LEFT JOIN fotos f ON vss.license_plate = f.license_plate
WHERE vss.sale_status = 'vendido'
AND f.license_plate IS NOT NULL
ORDER BY vss.license_plate;

-- 5. CONTAR VEHÍCULOS ARREGLADOS
SELECT 
    'TOTAL VEHÍCULOS ARREGLADOS' as info,
    COUNT(*) as total
FROM fotos 
WHERE license_plate IN (
    SELECT vss.license_plate
    FROM vehicle_sale_status vss
    WHERE vss.sale_status = 'vendido'
    AND vss.license_plate IS NOT NULL
)
AND estado_pintura = 'vendido'
AND photos_completed = false;

-- 6. VERIFICACIÓN FINAL - NO DEBERÍA HABER VEHÍCULOS VENDIDOS EN FOTOS PENDIENTES
SELECT 
    'VERIFICACIÓN FINAL' as info,
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

-- 7. CONTAR VEHÍCULOS VENDIDOS QUE SIGUEN EN FOTOS PENDIENTES (DEBERÍA SER 0)
SELECT 
    'TOTAL VENDIDOS EN FOTOS PENDIENTES (DEBERÍA SER 0)' as info,
    COUNT(*) as total
FROM vehicle_sale_status vss
LEFT JOIN fotos f ON vss.license_plate = f.license_plate
WHERE vss.sale_status = 'vendido'
AND f.license_plate IS NOT NULL
AND f.photos_completed = false
AND f.estado_pintura != 'vendido'; 