-- =====================================================
-- MARCAR FOTOS AUTOMÁTICO BASADO EN CSV DEL SCRAPER
-- =====================================================

-- Marcar vehículos como fotografiados basándose en URL foto 9 del CSV
UPDATE fotos 
SET 
    photos_completed = true,
    photos_completed_date = NOW(),
    updated_at = NOW()
WHERE license_plate IN (
    SELECT ds."Matrícula"
    FROM duc_scraper ds
    WHERE ds."URL foto 9" IS NOT NULL 
    AND ds."URL foto 9" != ''
    AND ds."Matrícula" IS NOT NULL
)
AND photos_completed = false;

-- Verificar cuántos vehículos se actualizaron
SELECT 
    'VEHÍCULOS MARCADOS COMO FOTOGRAFIADOS' as info,
    COUNT(*) as total_actualizados
FROM fotos 
WHERE photos_completed = true
AND photos_completed_date >= NOW() - INTERVAL '1 hour';

-- Mostrar los vehículos actualizados en la última hora
SELECT 
    'DETALLE DE VEHÍCULOS ACTUALIZADOS' as info,
    f.license_plate,
    f.model,
    f.photos_completed_date,
    ds."URL foto 9" as url_foto_9
FROM fotos f
LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
WHERE f.photos_completed = true
AND f.photos_completed_date >= NOW() - INTERVAL '1 hour'
ORDER BY f.photos_completed_date DESC; 