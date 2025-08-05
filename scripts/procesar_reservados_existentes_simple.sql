-- =====================================================
-- PROCESAR VEHÍCULOS RESERVADOS EXISTENTES (SIMPLE)
-- =====================================================
-- Descripción: Marcar como vendidos en stock los vehículos que están 
-- marcados como "RESERVADO" en duc_scraper
-- =====================================================

-- 1. MARCAR COMO VENDIDOS EN STOCK
UPDATE stock 
SET is_sold = true 
WHERE license_plate IN (
    SELECT DISTINCT "Matrícula" 
    FROM duc_scraper 
    WHERE "Disponibilidad" ILIKE '%reservado%'
    AND "Matrícula" IS NOT NULL
)
AND (is_sold IS NULL OR is_sold = false);

-- 2. MARCAR EN FOTOS COMO VENDIDOS
UPDATE fotos 
SET estado_pintura = 'vendido' 
WHERE license_plate IN (
    SELECT DISTINCT "Matrícula" 
    FROM duc_scraper 
    WHERE "Disponibilidad" ILIKE '%reservado%'
    AND "Matrícula" IS NOT NULL
);

-- 3. VERIFICAR RESULTADOS
SELECT 
    'RESULTADOS DEL PROCESAMIENTO' as info,
    COUNT(DISTINCT ds."Matrícula") as vehiculos_reservados_csv,
    COUNT(DISTINCT s.license_plate) as vehiculos_marcados_stock,
    COUNT(DISTINCT f.license_plate) as vehiculos_marcados_fotos
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate AND s.is_sold = true
LEFT JOIN fotos f ON ds."Matrícula" = f.license_plate AND f.estado_pintura = 'vendido'
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL; 