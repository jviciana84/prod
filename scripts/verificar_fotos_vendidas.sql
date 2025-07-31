-- =====================================================
-- VERIFICAR QUE LOS VEHÍCULOS RESERVADOS YA NO APAREZCAN COMO PENDIENTES
-- =====================================================

-- 1. VERIFICAR VEHÍCULOS RESERVADOS EN FOTOS (DEBERÍAN ESTAR COMO VENDIDOS)
SELECT 
    'VEHÍCULOS RESERVADOS EN FOTOS' as info,
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
ORDER BY ds."Matrícula";

-- 2. VERIFICAR QUE NO APAREZCAN EN FOTOS PENDIENTES
SELECT 
    'FOTOS PENDIENTES (DEBERÍAN SER 0)' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false;

-- 3. VERIFICAR QUE APAREZCAN EN VENDIDOS SIN FOTOGRAFÍAS
SELECT 
    'VENDIDOS SIN FOTOGRAFÍAS' as info,
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
AND f.estado_pintura = 'vendido'
ORDER BY ds."Matrícula";

-- 4. CONTAR VENDIDOS SIN FOTOGRAFÍAS
SELECT 
    'TOTAL VENDIDOS SIN FOTOGRAFÍAS' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.estado_pintura = 'vendido'; 