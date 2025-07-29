-- =====================================================
-- VERIFICACIÓN DE VEHÍCULOS VENDIDOS
-- =====================================================

-- 1. VEHÍCULOS VENDIDOS EN SALES_VEHICLES
SELECT 
    'SALES_VEHICLES' as tabla,
    license_plate,
    model,
    sale_date,
    advisor,
    price,
    payment_status,
    'VENDIDO' as estado_esperado
FROM sales_vehicles
ORDER BY sale_date DESC;

-- 2. VEHÍCULOS EN VEHICLE_SALE_STATUS COMO VENDIDOS
SELECT 
    'VEHICLE_SALE_STATUS' as tabla,
    license_plate,
    sale_status,
    created_at,
    'VENDIDO' as estado_esperado
FROM vehicle_sale_status
WHERE sale_status = 'vendido'
ORDER BY created_at DESC;

-- 3. VEHÍCULOS VENDIDOS QUE APARECEN EN STOCK (ERROR)
SELECT 
    'ERROR: VENDIDO EN STOCK' as problema,
    s.license_plate,
    s.model,
    s.reception_date,
    sv.sale_date,
    sv.advisor,
    'Debería estar en pestaña Vendido, no en Disponible' as descripcion
FROM stock s
INNER JOIN sales_vehicles sv ON s.license_plate = sv.license_plate
ORDER BY sv.sale_date DESC;

-- 4. VEHÍCULOS VENDIDOS QUE APARECEN EN FOTOS PENDIENTES (ERROR)
SELECT 
    'ERROR: VENDIDO EN FOTOS PENDIENTES' as problema,
    f.license_plate,
    f.model,
    f.photos_completed,
    sv.sale_date,
    sv.advisor,
    'Debería estar en pestaña Vendido, no en Fotos Pendientes' as descripcion
FROM fotos f
INNER JOIN sales_vehicles sv ON f.license_plate = sv.license_plate
WHERE f.photos_completed = false
ORDER BY sv.sale_date DESC;

-- 5. VEHÍCULOS VENDIDOS SIN FOTOS (POTENCIAL PROBLEMA)
SELECT 
    'VENDIDO SIN FOTOS' as tipo,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    sv.advisor,
    CASE 
        WHEN f.license_plate IS NULL THEN 'NO TIENE FOTOS'
        WHEN f.photos_completed = false THEN 'FOTOS PENDIENTES'
        ELSE 'TIENE FOTOS'
    END as estado_fotos,
    'Revisar si necesita fotos' as accion
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
ORDER BY sv.sale_date DESC;

-- 6. VEHÍCULOS EN VENTAS PREMATURAS
SELECT 
    'VENTAS PREMATURAS' as tipo,
    license_plate,
    model,
    sale_date,
    advisor,
    sold_before_photos_ready,
    sold_before_body_ready,
    'Revisar si es correcto' as accion
FROM sales_vehicles
WHERE sold_before_photos_ready = true OR sold_before_body_ready = true
ORDER BY sale_date DESC;

-- 7. VEHÍCULOS EN NO RETAIL (PROFESIONALES/TÁCTICOS)
SELECT 
    'NO RETAIL' as tipo,
    license_plate,
    sale_status,
    created_at,
    notes,
    'Revisar clasificación' as accion
FROM vehicle_sale_status
WHERE sale_status IN ('profesional', 'tactico_vn')
ORDER BY created_at DESC;

-- 8. RESUMEN DE CLASIFICACIONES
SELECT 
    'RESUMEN' as tipo,
    COUNT(*) as total_vehiculos,
    STRING_AGG(DISTINCT sale_status, ', ') as estados
FROM vehicle_sale_status;

-- 9. VEHÍCULOS CON PROBLEMAS DE CLASIFICACIÓN
SELECT 
    'PROBLEMAS DE CLASIFICACIÓN' as tipo,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    CASE 
        WHEN s.license_plate IS NOT NULL THEN 'EN STOCK (ERROR)'
        WHEN f.license_plate IS NOT NULL AND f.photos_completed = false THEN 'EN FOTOS PENDIENTES (ERROR)'
        WHEN vss.license_plate IS NULL THEN 'NO EN VEHICLE_SALE_STATUS (ERROR)'
        ELSE 'CLASIFICACIÓN CORRECTA'
    END as problema
FROM sales_vehicles sv
LEFT JOIN stock s ON sv.license_plate = s.license_plate
LEFT JOIN fotos f ON sv.license_plate = f.license_plate AND f.photos_completed = false
LEFT JOIN vehicle_sale_status vss ON sv.license_plate = vss.license_plate AND vss.sale_status = 'vendido'
WHERE s.license_plate IS NOT NULL 
   OR (f.license_plate IS NOT NULL AND f.photos_completed = false)
   OR vss.license_plate IS NULL
ORDER BY sv.sale_date DESC; 