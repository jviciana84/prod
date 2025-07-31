-- =====================================================
-- VERIFICAR PATRÓN SIMILAR AL 0736LRD
-- =====================================================

-- 1. BUSCAR VEHÍCULOS QUE ESTÁN EN FOTOS PENDIENTES PERO DEBERÍAN ESTAR VENDIDOS
SELECT 
    'VEHÍCULOS CON PROBLEMA SIMILAR' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    f.photos_completed,
    f.estado_pintura,
    f.license_plate,
    f.id as foto_id
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false
AND f.estado_pintura != 'vendido'
ORDER BY ds."Matrícula";

-- 2. CONTAR CUÁNTOS VEHÍCULOS TIENEN ESTE PROBLEMA
SELECT 
    'TOTAL VEHÍCULOS CON PROBLEMA' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false
AND f.estado_pintura != 'vendido';

-- 3. VERIFICAR VEHÍCULOS QUE ESTÁN RESERVADOS PERO NO ESTÁN EN FOTOS
SELECT 
    'RESERVADOS SIN FOTOS' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad"
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NULL
ORDER BY ds."Matrícula";

-- 4. VERIFICAR VEHÍCULOS QUE ESTÁN EN FOTOS PERO NO EN DUC_SCRAPER
SELECT 
    'FOTOS SIN DUC_SCRAPER' as info,
    f.license_plate,
    f.model,
    f.photos_completed,
    f.estado_pintura
FROM fotos f
LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
WHERE ds."Matrícula" IS NULL
AND f.photos_completed = false
ORDER BY f.license_plate;

-- 5. VERIFICAR VEHÍCULOS QUE ESTÁN EN SALES_VEHICLES PERO SIGUEN EN FOTOS PENDIENTES
SELECT 
    'VENDIDOS EN SALES PERO PENDIENTES EN FOTOS' as info,
    sv.license_plate,
    sv.model,
    sv.sale_date,
    f.photos_completed,
    f.estado_pintura
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
WHERE f.license_plate IS NOT NULL
AND f.photos_completed = false
ORDER BY sv.license_plate;

-- 6. VERIFICAR VEHÍCULOS QUE ESTÁN EN VEHICLE_SALE_STATUS COMO VENDIDOS PERO SIGUEN EN FOTOS PENDIENTES
SELECT 
    'VENDIDOS EN STATUS PERO PENDIENTES EN FOTOS' as info,
    vss.license_plate,
    vss.sale_status,
    vss.created_at,
    f.photos_completed,
    f.estado_pintura
FROM vehicle_sale_status vss
LEFT JOIN fotos f ON vss.license_plate = f.license_plate
WHERE vss.sale_status = 'vendido'
AND f.license_plate IS NOT NULL
AND f.photos_completed = false
ORDER BY vss.license_plate;

-- 7. BUSCAR PATRÓN ESPECÍFICO DEL 0736LRD (RESERVADO EN DUC, PENDIENTE EN FOTOS)
SELECT 
    'PATRÓN 0736LRD' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    f.photos_completed,
    f.estado_pintura,
    CASE 
        WHEN f.estado_pintura = 'vendido' THEN 'CORRECTO'
        WHEN f.estado_pintura = 'pendiente' THEN 'PROBLEMA - Debería estar como vendido'
        WHEN f.estado_pintura = 'apto' THEN 'PROBLEMA - Debería estar como vendido'
        WHEN f.estado_pintura = 'no_apto' THEN 'PROBLEMA - Debería estar como vendido'
        ELSE 'ESTADO DESCONOCIDO'
    END as diagnostico
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
ORDER BY ds."Matrícula"; 