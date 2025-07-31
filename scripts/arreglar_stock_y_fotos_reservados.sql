-- =====================================================
-- ARREGLAR VEHÍCULOS RESERVADOS EN STOCK Y FOTOS
-- =====================================================
-- Descripción: Arreglar vehículos que están como "RESERVADO" en el CSV
-- pero que siguen en stock y fotos pendientes
-- NO TOCAR SALES_VEHICLES - solo stock y fotos
-- =====================================================

-- 1. VERIFICAR CUÁNTOS VEHÍCULOS HAY QUE ARREGLAR
SELECT 
    'VEHÍCULOS A ARREGLAR EN STOCK' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND s.license_plate IS NOT NULL;

SELECT 
    'VEHÍCULOS A ARREGLAR EN FOTOS' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false;

-- 2. MOSTRAR VEHÍCULOS PROBLEMÁTICOS
SELECT 
    'PROBLEMA: RESERVADO PERO SIGUE EN STOCK' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    s.mechanical_status,
    s.body_status
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND s.license_plate IS NOT NULL;

SELECT 
    'PROBLEMA: RESERVADO PERO SIGUE EN FOTOS PENDIENTES' as info,
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
AND f.photos_completed = false;

-- 3. ARREGLAR STOCK - MOVER A VENDIDO
UPDATE stock 
SET 
    mechanical_status = 'vendido',
    body_status = 'vendido',
    updated_at = NOW()
WHERE license_plate IN (
    SELECT ds."Matrícula"
    FROM duc_scraper ds
    WHERE ds."Disponibilidad" ILIKE '%reservado%'
    AND ds."Matrícula" IS NOT NULL
);

-- 4. ARREGLAR FOTOS - MARCAR COMO VENDIDO
UPDATE fotos 
SET 
    estado_pintura = 'vendido',
    updated_at = NOW()
WHERE license_plate IN (
    SELECT ds."Matrícula"
    FROM duc_scraper ds
    WHERE ds."Disponibilidad" ILIKE '%reservado%'
    AND ds."Matrícula" IS NOT NULL
);

-- 5. VERIFICAR CAMBIOS
SELECT 
    'VERIFICACIÓN FINAL' as info,
    COUNT(*) as total_arreglados
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND s.license_plate IS NOT NULL
AND s.mechanical_status = 'vendido'
AND s.body_status = 'vendido';

SELECT 
    'VERIFICACIÓN FOTOS' as info,
    COUNT(*) as total_arreglados
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.estado_pintura = 'vendido'; 