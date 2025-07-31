-- =====================================================
-- PRUEBA DE LA FUNCIÓN DE MARCADO AUTOMÁTICO
-- =====================================================

-- Ejecutar la función manualmente
SELECT * FROM mark_photos_as_completed();

-- Verificar vehículos que tienen URL foto 9 en duc_scraper
SELECT 
    'VEHÍCULOS CON URL FOTO 9 EN DUC_SCRAPER' as info,
    ds."Matrícula",
    ds."URL foto 9"
FROM duc_scraper ds
WHERE ds."URL foto 9" IS NOT NULL 
AND ds."URL foto 9" != ''
AND ds."Matrícula" IS NOT NULL
LIMIT 10;

-- Verificar vehículos pendientes en fotos que coinciden con duc_scraper
SELECT 
    'VEHÍCULOS PENDIENTES QUE SE MARCARÁN' as info,
    f.license_plate,
    f.model,
    ds."URL foto 9"
FROM fotos f
INNER JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
WHERE ds."URL foto 9" IS NOT NULL 
AND ds."URL foto 9" != ''
AND f.photos_completed = false
LIMIT 10; 