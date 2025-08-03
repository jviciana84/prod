-- Script para verificar vehículos vendidos sin fotos
-- Ejecutar en Supabase SQL Editor

-- Ver vehículos pendientes que no se reasignaron (vendidos sin fotos)
SELECT 
    f.id,
    f.license_plate,
    f.assigned_to,
    f.photos_completed,
    f.created_at,
    sv.license_plate as sold_license,
    sv.status as sold_status,
    duc.matricula as duc_matricula,
    duc.estado_pintura as duc_status
FROM fotos f
LEFT JOIN sales_vehicles sv ON f.license_plate = sv.license_plate
LEFT JOIN duc_scraper duc ON f.license_plate = duc.matricula
WHERE f.photos_completed = false
AND (sv.license_plate IS NOT NULL OR duc.estado_pintura = 'reservado')
ORDER BY f.created_at DESC;

-- Contar diferentes tipos de vehículos pendientes
SELECT 
    COUNT(*) as total_pendientes,
    COUNT(CASE WHEN sv.license_plate IS NOT NULL THEN 1 END) as vendidos_en_sales,
    COUNT(CASE WHEN duc.estado_pintura = 'reservado' THEN 1 END) as reservados_en_duc,
    COUNT(CASE WHEN sv.license_plate IS NULL AND duc.estado_pintura != 'reservado' THEN 1 END) as pendientes_normales
FROM fotos f
LEFT JOIN sales_vehicles sv ON f.license_plate = sv.license_plate
LEFT JOIN duc_scraper duc ON f.license_plate = duc.matricula
WHERE f.photos_completed = false; 