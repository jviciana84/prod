-- =====================================================
-- VERIFICAR FOTOS PENDIENTES ACTUALES
-- =====================================================

-- 1. TODOS LOS VEHÍCULOS EN FOTOS PENDIENTES
SELECT 
    'TODOS LOS PENDIENTES' as info,
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
ORDER BY f.license_plate;

-- 2. VEHÍCULOS PENDIENTES QUE DEBERÍAN ESTAR VENDIDOS
SELECT 
    'PENDIENTES QUE DEBERÍAN ESTAR VENDIDOS' as info,
    f.license_plate,
    f.model,
    f.photos_completed,
    f.estado_pintura,
    CASE 
        WHEN ds."Disponibilidad" ILIKE '%reservado%' THEN 'RESERVADO EN DUC'
        WHEN ds."Disponibilidad" ILIKE '%vendido%' THEN 'VENDIDO EN DUC'
        WHEN sv.license_plate IS NOT NULL THEN 'VENDIDO EN SALES'
        WHEN vss.sale_status = 'vendido' THEN 'VENDIDO EN STATUS'
        ELSE 'NO VENDIDO'
    END as donde_vendido,
    ds."Disponibilidad" as estado_duc,
    sv.license_plate as en_sales,
    vss.sale_status as en_status
FROM fotos f
LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
LEFT JOIN sales_vehicles sv ON f.license_plate = sv.license_plate
LEFT JOIN vehicle_sale_status vss ON f.license_plate = vss.license_plate
WHERE f.photos_completed = false
AND (
    ds."Disponibilidad" ILIKE '%reservado%' OR
    ds."Disponibilidad" ILIKE '%vendido%' OR
    sv.license_plate IS NOT NULL OR
    vss.sale_status = 'vendido'
)
ORDER BY f.license_plate;

-- 3. CONTAR PENDIENTES QUE DEBERÍAN ESTAR VENDIDOS
SELECT 
    'TOTAL PENDIENTES QUE DEBERÍAN ESTAR VENDIDOS' as info,
    COUNT(*) as total
FROM fotos f
LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
LEFT JOIN sales_vehicles sv ON f.license_plate = sv.license_plate
LEFT JOIN vehicle_sale_status vss ON f.license_plate = vss.license_plate
WHERE f.photos_completed = false
AND (
    ds."Disponibilidad" ILIKE '%reservado%' OR
    ds."Disponibilidad" ILIKE '%vendido%' OR
    sv.license_plate IS NOT NULL OR
    vss.sale_status = 'vendido'
);

-- 4. VERIFICAR ESPECÍFICAMENTE EL 0736LRD
SELECT 
    'ESTADO ESPECÍFICO 0736LRD' as info,
    f.license_plate,
    f.model,
    f.photos_completed,
    f.estado_pintura,
    f.created_at,
    f.updated_at,
    ds."Disponibilidad" as estado_duc,
    sv.license_plate as en_sales,
    vss.sale_status as en_status
FROM fotos f
LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
LEFT JOIN sales_vehicles sv ON f.license_plate = sv.license_plate
LEFT JOIN vehicle_sale_status vss ON f.license_plate = vss.license_plate
WHERE f.license_plate = '0736LRD';

-- 5. BUSCAR VEHÍCULOS QUE ESTÁN EN FOTOS PERO NO EN DUC_SCRAPER
SELECT 
    'FOTOS SIN DUC_SCRAPER' as info,
    f.license_plate,
    f.model,
    f.photos_completed,
    f.estado_pintura,
    f.created_at
FROM fotos f
LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
WHERE ds."Matrícula" IS NULL
AND f.photos_completed = false
ORDER BY f.license_plate; 