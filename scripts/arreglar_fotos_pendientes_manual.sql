-- =====================================================
-- ARREGLAR FOTOS PENDIENTES MANUALMENTE
-- =====================================================

-- 1. ARREGLAR VEHÍCULOS RESERVADOS EN DUC QUE ESTÁN PENDIENTES EN FOTOS
UPDATE fotos 
SET 
    estado_pintura = 'vendido',
    updated_at = NOW()
WHERE license_plate IN (
    SELECT ds."Matrícula"
    FROM duc_scraper ds
    WHERE ds."Disponibilidad" ILIKE '%reservado%'
    AND ds."Matrícula" IS NOT NULL
)
AND photos_completed = false
AND estado_pintura != 'vendido';

-- 2. ARREGLAR VEHÍCULOS VENDIDOS EN DUC QUE ESTÁN PENDIENTES EN FOTOS
UPDATE fotos 
SET 
    estado_pintura = 'vendido',
    updated_at = NOW()
WHERE license_plate IN (
    SELECT ds."Matrícula"
    FROM duc_scraper ds
    WHERE ds."Disponibilidad" ILIKE '%vendido%'
    AND ds."Matrícula" IS NOT NULL
)
AND photos_completed = false
AND estado_pintura != 'vendido';

-- 3. ARREGLAR VEHÍCULOS EN SALES_VEHICLES QUE ESTÁN PENDIENTES EN FOTOS
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

-- 4. ARREGLAR VEHÍCULOS EN VEHICLE_SALE_STATUS VENDIDOS QUE ESTÁN PENDIENTES EN FOTOS
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

-- 5. VERIFICAR CAMBIOS APLICADOS
SELECT 
    'VERIFICACIÓN DESPUÉS DEL ARREGLO' as info,
    f.license_plate,
    f.model,
    f.photos_completed,
    f.estado_pintura,
    f.updated_at,
    CASE 
        WHEN ds."Disponibilidad" ILIKE '%reservado%' THEN 'RESERVADO EN DUC'
        WHEN ds."Disponibilidad" ILIKE '%vendido%' THEN 'VENDIDO EN DUC'
        WHEN sv.license_plate IS NOT NULL THEN 'VENDIDO EN SALES'
        WHEN vss.sale_status = 'vendido' THEN 'VENDIDO EN STATUS'
        ELSE 'NO VENDIDO'
    END as donde_vendido
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

-- 6. CONTAR VEHÍCULOS ARREGLADOS
SELECT 
    'TOTAL VEHÍCULOS ARREGLADOS' as info,
    COUNT(*) as total
FROM fotos 
WHERE estado_pintura = 'vendido'
AND photos_completed = false
AND updated_at >= NOW() - INTERVAL '1 hour';

-- 7. VERIFICACIÓN FINAL - NO DEBERÍA HABER VEHÍCULOS VENDIDOS EN FOTOS PENDIENTES
SELECT 
    'VERIFICACIÓN FINAL' as info,
    COUNT(*) as total_pendientes_vendidos
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