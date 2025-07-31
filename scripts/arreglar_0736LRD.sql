-- =====================================================
-- ARREGLAR PROBLEMA DEL 0736LRD Y VEHÍCULOS SIMILARES
-- =====================================================

-- 1. VERIFICAR ESTADO ACTUAL DEL 0736LRD
SELECT 
    'ESTADO ACTUAL 0736LRD' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    f.photos_completed,
    f.estado_pintura,
    f.id as foto_id
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Matrícula" = '0736LRD';

-- 2. ARREGLAR 0736LRD ESPECÍFICAMENTE
UPDATE fotos 
SET 
    estado_pintura = 'vendido',
    updated_at = NOW()
WHERE license_plate = '0736LRD'
AND photos_completed = false;

-- 3. VERIFICAR CAMBIO EN 0736LRD
SELECT 
    'ESTADO DESPUÉS DEL ARREGLO 0736LRD' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    f.photos_completed,
    f.estado_pintura,
    f.updated_at
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Matrícula" = '0736LRD';

-- 4. ARREGLAR TODOS LOS VEHÍCULOS RESERVADOS QUE ESTÁN EN FOTOS PENDIENTES
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
AND photos_completed = false
AND estado_pintura != 'vendido';

-- 5. VERIFICAR CUÁNTOS VEHÍCULOS SE ARREGLARON
SELECT 
    'TOTAL VEHÍCULOS ARREGLADOS' as info,
    COUNT(*) as total
FROM fotos 
WHERE license_plate IN (
    SELECT ds."Matrícula"
    FROM duc_scraper ds
    WHERE ds."Disponibilidad" ILIKE '%reservado%'
    AND ds."Matrícula" IS NOT NULL
)
AND estado_pintura = 'vendido'
AND photos_completed = false;

-- 6. VERIFICAR QUE NO QUEDEN VEHÍCULOS RESERVADOS EN FOTOS PENDIENTES
SELECT 
    'VERIFICACIÓN FINAL' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    f.photos_completed,
    f.estado_pintura,
    CASE 
        WHEN f.estado_pintura = 'vendido' THEN 'CORRECTO'
        ELSE 'AÚN TIENE PROBLEMA'
    END as estado
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false
ORDER BY ds."Matrícula";

-- 7. CONTAR VEHÍCULOS RESERVADOS QUE SIGUEN EN FOTOS PENDIENTES (DEBERÍA SER 0)
SELECT 
    'TOTAL RESERVADOS EN FOTOS PENDIENTES (DEBERÍA SER 0)' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND f.license_plate IS NOT NULL
AND f.photos_completed = false
AND f.estado_pintura != 'vendido'; 