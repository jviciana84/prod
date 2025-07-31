-- =====================================================
-- ARREGLAR FOTOS PENDIENTES DE VEHÍCULOS RESERVADOS
-- =====================================================
-- Descripción: Arreglar específicamente los vehículos que están como "RESERVADO" 
-- en el CSV pero que siguen en fotos pendientes
-- =====================================================

-- 1. MOSTRAR VEHÍCULOS RESERVADOS EN FOTOS PENDIENTES
SELECT 
    'VEHÍCULOS RESERVADOS EN FOTOS PENDIENTES' as info,
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

-- 2. CONTAR CUÁNTOS HAY
SELECT 
    'TOTAL A ARREGLAR' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false;

-- 3. ARREGLAR FOTOS - MARCAR COMO VENDIDO
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
AND photos_completed = false;

-- 4. VERIFICAR CAMBIOS
SELECT 
    'VERIFICACIÓN DESPUÉS DEL ARREGLO' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    f.photos_completed,
    f.estado_pintura
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false
ORDER BY ds."Matrícula";

-- 5. CONTAR CUÁNTOS QUEDAN SIN ARREGLAR
SELECT 
    'TOTAL QUE QUEDAN SIN ARREGLAR' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false; 