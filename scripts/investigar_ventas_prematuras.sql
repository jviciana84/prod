-- =====================================================
-- INVESTIGAR VENTAS PREMATURAS EN FOTOS PENDIENTES
-- =====================================================

-- 1. BUSCAR VEHÍCULOS QUE ESTÁN EN FOTOS PENDIENTES PERO DEBERÍAN ESTAR VENDIDOS
SELECT 
    'VEHÍCULOS PENDIENTES QUE DEBERÍAN ESTAR VENDIDOS' as info,
    f.license_plate,
    f.model,
    f.photos_completed,
    f.estado_pintura,
    f.created_at,
    f.updated_at,
    CASE 
        WHEN ds."Matrícula" IS NOT NULL THEN ds."Disponibilidad"
        ELSE 'No está en DUC_SCRAPER'
    END as estado_duc,
    CASE 
        WHEN sv.license_plate IS NOT NULL THEN 'Está en SALES_VEHICLES'
        ELSE 'No está en SALES_VEHICLES'
    END as en_sales,
    CASE 
        WHEN vss.license_plate IS NOT NULL THEN vss.sale_status
        ELSE 'No está en VEHICLE_SALE_STATUS'
    END as estado_venta
FROM fotos f
LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
LEFT JOIN sales_vehicles sv ON f.license_plate = sv.license_plate
LEFT JOIN vehicle_sale_status vss ON f.license_plate = vss.license_plate
WHERE f.photos_completed = false
AND f.estado_pintura != 'vendido'
ORDER BY f.license_plate;

-- 2. VERIFICAR VEHÍCULOS QUE ESTÁN EN SALES_VEHICLES PERO SIGUEN PENDIENTES EN FOTOS
SELECT 
    'VENDIDOS EN SALES PERO PENDIENTES EN FOTOS' as info,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    sv.advisor_name,
    f.photos_completed,
    f.estado_pintura,
    f.created_at as foto_created,
    sv.created_at as sale_created
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
WHERE f.license_plate IS NOT NULL
AND f.photos_completed = false
ORDER BY sv.license_plate;

-- 3. VERIFICAR VEHÍCULOS QUE ESTÁN EN VEHICLE_SALE_STATUS COMO VENDIDOS PERO SIGUEN PENDIENTES
SELECT 
    'VENDIDOS EN STATUS PERO PENDIENTES EN FOTOS' as info,
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

-- 4. BUSCAR VEHÍCULOS QUE FUERON VENDIDOS ANTES DE QUE SE CREARAN EN FOTOS
SELECT 
    'VENTAS PREMATURAS' as info,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    f.photos_completed,
    f.estado_pintura,
    f.created_at as foto_created,
    sv.created_at as sale_created,
    CASE 
        WHEN sv.created_at < f.created_at THEN 'Vendido antes de fotos'
        WHEN sv.created_at > f.created_at THEN 'Fotos antes de venta'
        ELSE 'Misma fecha'
    END as orden_creacion
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
WHERE f.license_plate IS NOT NULL
AND f.photos_completed = false
AND sv.created_at < f.created_at
ORDER BY sv.license_plate;

-- 5. CONTAR VEHÍCULOS CON PROBLEMA DE VENTAS PREMATURAS
SELECT 
    'TOTAL VENTAS PREMATURAS' as info,
    COUNT(*) as total
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
WHERE f.license_plate IS NOT NULL
AND f.photos_completed = false
AND sv.created_at < f.created_at;

-- 6. VERIFICAR SI HAY VEHÍCULOS EN DUC_SCRAPER COMO DISPONIBLES PERO VENDIDOS EN OTRAS TABLAS
SELECT 
    'DISPONIBLES EN DUC PERO VENDIDOS EN OTROS LUGARES' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    CASE 
        WHEN sv.license_plate IS NOT NULL THEN 'Vendido en SALES_VEHICLES'
        WHEN vss.license_plate IS NOT NULL THEN 'Vendido en VEHICLE_SALE_STATUS'
        ELSE 'No vendido'
    END as donde_vendido,
    f.photos_completed,
    f.estado_pintura
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
LEFT JOIN vehicle_sale_status vss ON ds."Matrícula" = vss.license_plate
WHERE ds."Disponibilidad" ILIKE '%disponible%'
AND (sv.license_plate IS NOT NULL OR vss.license_plate IS NOT NULL)
ORDER BY ds."Matrícula"; 