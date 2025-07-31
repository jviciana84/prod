-- =====================================================
-- ARREGLAR TODOS LOS VEHÍCULOS RESERVADOS
-- =====================================================
-- Descripción: Arreglar automáticamente todos los vehículos que están como "RESERVADO" 
-- en el CSV pero que NO se movieron automáticamente a vendido
-- =====================================================

-- 1. VERIFICAR CUÁNTOS VEHÍCULOS HAY QUE ARREGLAR
SELECT 
    'VEHÍCULOS A ARREGLAR' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND sv.license_plate IS NULL;

-- 2. ARREGLAR TODOS LOS VEHÍCULOS RESERVADOS
-- Simular el cambio de "Disponible" a "Reservado" para activar el trigger en todos
UPDATE duc_scraper 
SET "Disponibilidad" = 'Disponible' 
WHERE "Disponibilidad" ILIKE '%reservado%'
AND "Matrícula" IS NOT NULL;

-- Ahora cambiar a "Reservado" para activar el trigger en todos
UPDATE duc_scraper 
SET "Disponibilidad" = 'RESERVADO' 
WHERE "Disponibilidad" = 'Disponible'
AND "Matrícula" IS NOT NULL;

-- 3. VERIFICAR RESULTADOS
SELECT 
    'RESULTADOS DESPUÉS DEL ARREGLO' as info,
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

-- 4. MOSTRAR VEHÍCULOS QUE SIGUEN CON PROBLEMAS (SI LOS HAY)
SELECT 
    'VEHÍCULOS QUE SIGUEN CON PROBLEMAS' as info,
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
AND (sv.license_plate IS NULL OR s.license_plate IS NOT NULL OR (f.license_plate IS NOT NULL AND f.photos_completed = false))
ORDER BY ds.last_seen_date DESC; 