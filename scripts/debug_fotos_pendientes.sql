-- =====================================================
-- DEBUG: INVESTIGAR POR QUÉ NO SE ARREGLAN LAS FOTOS
-- =====================================================

-- 1. VER TODOS LOS VEHÍCULOS RESERVADOS EN FOTOS PENDIENTES
SELECT 
    'VEHÍCULOS PROBLEMÁTICOS' as info,
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
ORDER BY ds."Matrícula";

-- 2. VERIFICAR SI EL UPDATE AFECTÓ A ALGÚN REGISTRO
SELECT 
    'REGISTROS AFECTADOS POR EL UPDATE' as info,
    COUNT(*) as total_afectados
FROM fotos 
WHERE license_plate IN (
    SELECT ds."Matrícula"
    FROM duc_scraper ds
    WHERE ds."Disponibilidad" ILIKE '%reservado%'
    AND ds."Matrícula" IS NOT NULL
)
AND photos_completed = false
AND estado_pintura = 'vendido';

-- 3. VERIFICAR SI HAY VEHÍCULOS RESERVADOS QUE NO ESTÁN EN FOTOS
SELECT 
    'RESERVADOS SIN FOTOS' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad"
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NULL;

-- 4. VERIFICAR SI HAY PROBLEMAS CON LA CONDICIÓN photos_completed
SELECT 
    'FOTOS CON photos_completed = NULL' as info,
    ds."Matrícula",
    ds."Modelo",
    f.photos_completed,
    f.estado_pintura
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed IS NULL;

-- 5. INTENTAR UPDATE MÁS ESPECÍFICO
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
AND (photos_completed = false OR photos_completed IS NULL);

-- 6. VERIFICAR RESULTADO DEL UPDATE ESPECÍFICO
SELECT 
    'DESPUÉS DEL UPDATE ESPECÍFICO' as info,
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