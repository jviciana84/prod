-- =====================================================
-- INVESTIGAR VEHÍCULO ESPECÍFICO: 0736LRD
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
WHERE "Matrícula" = '0736LRD';

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
WHERE license_plate = '0736LRD';

-- 3. VERIFICAR ESTADO EN FOTOS
SELECT 
    'FOTOS' as tabla,
    license_plate,
    model,
    photos_completed,
    photos_completed_date,
    estado_pintura,
    disponible,
    created_at,
    updated_at
FROM fotos 
WHERE license_plate = '0736LRD';

-- 4. VERIFICAR SI ESTÁ EN SALES_VEHICLES
SELECT 
    'SALES_VEHICLES' as tabla,
    license_plate,
    model,
    sale_date,
    advisor,
    created_at
FROM sales_vehicles 
WHERE license_plate = '0736LRD';

-- 5. VERIFICAR SI ESTÁ EN VEHICLE_SALE_STATUS
SELECT 
    'VEHICLE_SALE_STATUS' as tabla,
    license_plate,
    sale_status,
    created_at
FROM vehicle_sale_status 
WHERE license_plate = '0736LRD';

-- 6. VERIFICAR SI ESTÁ EN NUEVAS_ENTRADAS
SELECT 
    'NUEVAS_ENTRADAS' as tabla,
    license_plate,
    model,
    is_received,
    reception_date,
    created_at
FROM nuevas_entradas 
WHERE license_plate = '0736LRD';

-- 7. VERIFICAR SI ESTÁ EN VEHICLE_SALE_STATUS CON ESTADO VENDIDO
SELECT 
    'VEHICLE_SALE_STATUS VENDIDO' as tabla,
    license_plate,
    sale_status,
    created_at
FROM vehicle_sale_status 
WHERE license_plate = '0736LRD'
AND sale_status = 'vendido';

-- 8. VERIFICAR SI HAY INCONSISTENCIAS EN EL ESTADO
SELECT 
    'ANÁLISIS DE INCONSISTENCIAS' as info,
    CASE 
        WHEN ds."Matrícula" IS NOT NULL THEN 'Está en DUC_SCRAPER'
        ELSE 'NO está en DUC_SCRAPER'
    END as en_duc_scraper,
    CASE 
        WHEN f.license_plate IS NOT NULL THEN 'Está en FOTOS'
        ELSE 'NO está en FOTOS'
    END as en_fotos,
    CASE 
        WHEN f.photos_completed = true THEN 'Fotos completadas'
        WHEN f.photos_completed = false THEN 'Fotos pendientes'
        ELSE 'Estado desconocido'
    END as estado_fotos,
    CASE 
        WHEN f.estado_pintura = 'vendido' THEN 'Marcado como vendido'
        WHEN f.estado_pintura = 'pendiente' THEN 'Pendiente de pintura'
        WHEN f.estado_pintura = 'apto' THEN 'Apto para fotos'
        WHEN f.estado_pintura = 'no_apto' THEN 'No apto para fotos'
        ELSE 'Estado de pintura desconocido'
    END as estado_pintura,
    CASE 
        WHEN sv.license_plate IS NOT NULL THEN 'Está en SALES_VEHICLES'
        ELSE 'NO está en SALES_VEHICLES'
    END as en_sales_vehicles,
    CASE 
        WHEN vss.license_plate IS NOT NULL THEN 'Está en VEHICLE_SALE_STATUS'
        ELSE 'NO está en VEHICLE_SALE_STATUS'
    END as en_vehicle_sale_status
FROM duc_scraper ds
FULL OUTER JOIN fotos f ON ds."Matrícula" = f.license_plate
FULL OUTER JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
FULL OUTER JOIN vehicle_sale_status vss ON ds."Matrícula" = vss.license_plate
WHERE ds."Matrícula" = '0736LRD' 
   OR f.license_plate = '0736LRD'
   OR sv.license_plate = '0736LRD'
   OR vss.license_plate = '0736LRD';

-- 9. VERIFICAR SI DEBERÍA ESTAR MARCADO COMO VENDIDO
SELECT 
    'VERIFICACIÓN DE VENTA' as info,
    CASE 
        WHEN ds."Disponibilidad" ILIKE '%reservado%' THEN 'Está reservado en DUC'
        WHEN ds."Disponibilidad" ILIKE '%vendido%' THEN 'Está vendido en DUC'
        WHEN ds."Disponibilidad" ILIKE '%disponible%' THEN 'Está disponible en DUC'
        ELSE 'Estado desconocido en DUC: ' || ds."Disponibilidad"
    END as estado_duc,
    CASE 
        WHEN f.estado_pintura = 'vendido' THEN 'Ya está marcado como vendido en fotos'
        WHEN f.estado_pintura = 'pendiente' THEN 'Está pendiente en fotos'
        WHEN f.estado_pintura = 'apto' THEN 'Está apto en fotos'
        WHEN f.estado_pintura = 'no_apto' THEN 'No está apto en fotos'
        ELSE 'No está en fotos'
    END as estado_fotos,
    CASE 
        WHEN f.photos_completed = true THEN 'Fotos completadas'
        WHEN f.photos_completed = false THEN 'Fotos pendientes'
        ELSE 'Estado de fotos desconocido'
    END as estado_fotografias
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Matrícula" = '0736LRD'; 