-- =====================================================
-- INVESTIGAR VEHÍCULOS ESPECÍFICOS: 0786LRD y 8601JTB
-- =====================================================

-- 1. VERIFICAR ESTADO EN DUC_SCRAPER
SELECT 
    'DUC_SCRAPER' as tabla,
    "Matrícula",
    "Modelo",
    "Disponibilidad",
    last_seen_date,
    import_date
FROM duc_scraper 
WHERE "Matrícula" IN ('0786LRD', '8601JTB');

-- 2. VERIFICAR ESTADO EN STOCK
SELECT 
    'STOCK' as tabla,
    license_plate,
    model,
    mechanical_status,
    body_status,
    reception_date,
    created_at
FROM stock 
WHERE license_plate IN ('0786LRD', '8601JTB');

-- 3. VERIFICAR ESTADO EN FOTOS
SELECT 
    'FOTOS' as tabla,
    license_plate,
    model,
    photos_completed,
    photos_completed_date,
    estado_pintura,
    disponible,
    created_at
FROM fotos 
WHERE license_plate IN ('0786LRD', '8601JTB');

-- 4. VERIFICAR SI ESTÁN EN SALES_VEHICLES (NO DEBERÍAN ESTAR)
SELECT 
    'SALES_VEHICLES' as tabla,
    license_plate,
    model,
    sale_date,
    advisor,
    created_at
FROM sales_vehicles 
WHERE license_plate IN ('0786LRD', '8601JTB');

-- 5. VERIFICAR SI ESTÁN EN VEHICLE_SALE_STATUS
SELECT 
    'VEHICLE_SALE_STATUS' as tabla,
    license_plate,
    sale_status,
    created_at
FROM vehicle_sale_status 
WHERE license_plate IN ('0786LRD', '8601JTB');

-- 6. VERIFICAR SI ESTÁN EN NUEVAS_ENTRADAS
SELECT 
    'NUEVAS_ENTRADAS' as tabla,
    license_plate,
    model,
    is_received,
    reception_date,
    created_at
FROM nuevas_entradas 
WHERE license_plate IN ('0786LRD', '8601JTB');

-- 7. BUSCAR TODOS LOS VEHÍCULOS RESERVADOS QUE SIGUEN EN FOTOS PENDIENTES
SELECT 
    'TODOS LOS RESERVADOS EN FOTOS PENDIENTES' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    f.photos_completed,
    f.estado_pintura,
    f.license_plate
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false
ORDER BY ds."Matrícula";

-- 8. CONTAR CUÁNTOS RESERVADOS SIGUEN EN FOTOS PENDIENTES
SELECT 
    'TOTAL RESERVADOS EN FOTOS PENDIENTES' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false; 