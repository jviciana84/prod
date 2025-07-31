-- =====================================================
-- IDENTIFICAR LOS 3 VEHÍCULOS PENDIENTES ESPECÍFICOS
-- =====================================================

-- 1. MOSTRAR EXACTAMENTE CUÁLES SON LOS 3 VEHÍCULOS PENDIENTES
SELECT 
    'LOS 3 VEHÍCULOS PENDIENTES' as info,
    f.license_plate,
    f.model,
    f.photos_completed,
    f.estado_pintura,
    f.created_at,
    f.updated_at,
    ds."Disponibilidad" as estado_duc,
    sv.license_plate as en_sales,
    vss.sale_status as en_status,
    CASE 
        WHEN ds."Disponibilidad" ILIKE '%reservado%' THEN 'RESERVADO EN DUC'
        WHEN ds."Disponibilidad" ILIKE '%vendido%' THEN 'VENDIDO EN DUC'
        WHEN sv.license_plate IS NOT NULL THEN 'VENDIDO EN SALES'
        WHEN vss.sale_status = 'vendido' THEN 'VENDIDO EN STATUS'
        ELSE 'NO VENDIDO'
    END as donde_deberia_estar_vendido
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

-- 2. VERIFICAR SI ESTOS VEHÍCULOS ESTÁN EN DUC_SCRAPER
SELECT 
    'VERIFICACIÓN EN DUC_SCRAPER' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    ds.last_seen_date
FROM duc_scraper ds
WHERE ds."Matrícula" IN (
    SELECT f.license_plate
    FROM fotos f
    LEFT JOIN duc_scraper ds2 ON f.license_plate = ds2."Matrícula"
    LEFT JOIN sales_vehicles sv ON f.license_plate = sv.license_plate
    LEFT JOIN vehicle_sale_status vss ON f.license_plate = vss.license_plate
    WHERE f.photos_completed = false
    AND (
        ds2."Disponibilidad" ILIKE '%reservado%' OR
        ds2."Disponibilidad" ILIKE '%vendido%' OR
        sv.license_plate IS NOT NULL OR
        vss.sale_status = 'vendido'
    )
);

-- 3. VERIFICAR SI ESTOS VEHÍCULOS ESTÁN EN SALES_VEHICLES
SELECT 
    'VERIFICACIÓN EN SALES_VEHICLES' as info,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    sv.advisor_name
FROM sales_vehicles sv
WHERE sv.license_plate IN (
    SELECT f.license_plate
    FROM fotos f
    LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
    LEFT JOIN sales_vehicles sv2 ON f.license_plate = sv2.license_plate
    LEFT JOIN vehicle_sale_status vss ON f.license_plate = vss.license_plate
    WHERE f.photos_completed = false
    AND (
        ds."Disponibilidad" ILIKE '%reservado%' OR
        ds."Disponibilidad" ILIKE '%vendido%' OR
        sv2.license_plate IS NOT NULL OR
        vss.sale_status = 'vendido'
    )
);

-- 4. VERIFICAR SI ESTOS VEHÍCULOS ESTÁN EN VEHICLE_SALE_STATUS
SELECT 
    'VERIFICACIÓN EN VEHICLE_SALE_STATUS' as info,
    vss.license_plate,
    vss.sale_status,
    vss.created_at
FROM vehicle_sale_status vss
WHERE vss.license_plate IN (
    SELECT f.license_plate
    FROM fotos f
    LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
    LEFT JOIN sales_vehicles sv ON f.license_plate = sv.license_plate
    LEFT JOIN vehicle_sale_status vss2 ON f.license_plate = vss2.license_plate
    WHERE f.photos_completed = false
    AND (
        ds."Disponibilidad" ILIKE '%reservado%' OR
        ds."Disponibilidad" ILIKE '%vendido%' OR
        sv.license_plate IS NOT NULL OR
        vss2.sale_status = 'vendido'
    )
);

-- 5. INTENTAR ARREGLAR MANUALMENTE ESTOS 3 VEHÍCULOS ESPECÍFICOS
UPDATE fotos 
SET 
    estado_pintura = 'vendido',
    updated_at = NOW()
WHERE license_plate IN (
    SELECT f.license_plate
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
)
AND photos_completed = false
AND estado_pintura != 'vendido';

-- 6. VERIFICAR DESPUÉS DEL ARREGLO MANUAL
SELECT 
    'VERIFICACIÓN DESPUÉS DEL ARREGLO MANUAL' as info,
    f.license_plate,
    f.model,
    f.photos_completed,
    f.estado_pintura,
    f.updated_at
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