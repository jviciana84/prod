-- =====================================================
-- REVISAR TODOS LOS VEHÍCULOS RESERVADOS
-- =====================================================
-- Descripción: Encontrar todos los vehículos que están como "RESERVADO" 
-- en el CSV pero que NO se movieron automáticamente a vendido
-- =====================================================

-- 1. ENCONTRAR TODOS LOS VEHÍCULOS RESERVADOS EN CSV
SELECT 
    'VEHÍCULOS RESERVADOS EN CSV' as info,
    COUNT(*) as total
FROM duc_scraper 
WHERE "Disponibilidad" ILIKE '%reservado%'
AND "Matrícula" IS NOT NULL;

-- 2. ENCONTRAR VEHÍCULOS RESERVADOS QUE NO ESTÁN EN SALES_VEHICLES
SELECT 
    'PROBLEMA: RESERVADO PERO NO EN SALES_VEHICLES' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Marca",
    ds."Disponibilidad",
    ds."Concesionario",
    ds.last_seen_date
FROM duc_scraper ds
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND sv.license_plate IS NULL
ORDER BY ds.last_seen_date DESC;

-- 3. ENCONTRAR VEHÍCULOS RESERVADOS QUE SIGUEN EN STOCK
SELECT 
    'PROBLEMA: RESERVADO PERO SIGUE EN STOCK' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    s.mechanical_status,
    s.body_status
FROM duc_scraper ds
INNER JOIN stock s ON ds."Matrícula" = s.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
ORDER BY ds.last_seen_date DESC;

-- 4. ENCONTRAR VEHÍCULOS RESERVADOS QUE SIGUEN EN FOTOS PENDIENTES
SELECT 
    'PROBLEMA: RESERVADO PERO SIGUE EN FOTOS PENDIENTES' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    f.photos_completed,
    f.estado_pintura
FROM duc_scraper ds
INNER JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.photos_completed = false
ORDER BY ds.last_seen_date DESC;

-- 5. RESUMEN DE PROBLEMAS
SELECT 
    'RESUMEN DE PROBLEMAS' as info,
    COUNT(DISTINCT ds."Matrícula") as vehiculos_reservados,
    COUNT(DISTINCT sv.license_plate) as vehiculos_en_sales,
    COUNT(DISTINCT CASE WHEN sv.license_plate IS NULL THEN ds."Matrícula" END) as vehiculos_sin_sales,
    COUNT(DISTINCT s.license_plate) as vehiculos_en_stock,
    COUNT(DISTINCT f.license_plate) as vehiculos_en_fotos_pendientes
FROM duc_scraper ds
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate AND f.photos_completed = false
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL;

-- 6. LISTA COMPLETA PARA ARREGLAR MANUALMENTE
SELECT 
    'LISTA PARA ARREGLAR MANUALMENTE' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Marca",
    ds."Disponibilidad",
    ds."Concesionario",
    CASE 
        WHEN sv.license_plate IS NULL THEN '❌ NO EN SALES'
        ELSE '✅ EN SALES'
    END as estado_sales,
    CASE 
        WHEN s.license_plate IS NOT NULL THEN '❌ SIGUE EN STOCK'
        ELSE '✅ NO EN STOCK'
    END as estado_stock,
    CASE 
        WHEN f.license_plate IS NOT NULL AND f.photos_completed = false THEN '❌ SIGUE EN FOTOS PENDIENTES'
        ELSE '✅ NO EN FOTOS PENDIENTES'
    END as estado_fotos
FROM duc_scraper ds
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate AND f.photos_completed = false
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
ORDER BY ds.last_seen_date DESC; 