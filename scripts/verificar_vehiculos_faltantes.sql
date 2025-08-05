-- =====================================================
-- VERIFICAR VEHÍCULOS RESERVADOS FALTANTES
-- =====================================================
-- Descripción: Verificar qué vehículos reservados del CSV no existen
-- en las tablas stock o fotos
-- =====================================================

-- 1. VEHÍCULOS RESERVADOS QUE NO EXISTEN EN STOCK
SELECT 
    'VEHÍCULOS RESERVADOS SIN STOCK' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND s.license_plate IS NULL;

-- 2. VEHÍCULOS RESERVADOS QUE NO EXISTEN EN FOTOS
SELECT 
    'VEHÍCULOS RESERVADOS SIN FOTOS' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NULL;

-- 3. MOSTRAR EJEMPLOS DE VEHÍCULOS RESERVADOS SIN STOCK
SELECT 
    'EJEMPLOS: RESERVADOS SIN STOCK' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    ds.last_seen_date
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND s.license_plate IS NULL
ORDER BY ds.last_seen_date DESC
LIMIT 10;

-- 4. MOSTRAR EJEMPLOS DE VEHÍCULOS RESERVADOS SIN FOTOS
SELECT 
    'EJEMPLOS: RESERVADOS SIN FOTOS' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    ds.last_seen_date
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NULL
ORDER BY ds.last_seen_date DESC
LIMIT 10;

-- 5. RESUMEN COMPLETO
SELECT 
    'RESUMEN COMPLETO' as info,
    COUNT(DISTINCT ds."Matrícula") as total_reservados_csv,
    COUNT(DISTINCT s.license_plate) as en_stock,
    COUNT(DISTINCT f.license_plate) as en_fotos,
    COUNT(DISTINCT CASE WHEN s.license_plate IS NULL THEN ds."Matrícula" END) as sin_stock,
    COUNT(DISTINCT CASE WHEN f.license_plate IS NULL THEN ds."Matrícula" END) as sin_fotos
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL; 