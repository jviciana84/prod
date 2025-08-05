-- =====================================================
-- VERIFICAR ESTADO ACTUAL DE VEHÍCULOS RESERVADOS
-- =====================================================
-- Descripción: Verificar cuántos vehículos están marcados como reservados
-- en el CSV pero no están sincronizados correctamente
-- =====================================================

-- 1. CONTAR VEHÍCULOS RESERVADOS EN CSV
SELECT 
    'VEHÍCULOS RESERVADOS EN CSV' as info,
    COUNT(*) as total
FROM duc_scraper 
WHERE "Disponibilidad" ILIKE '%reservado%'
AND "Matrícula" IS NOT NULL;

-- 2. VERIFICAR VEHÍCULOS RESERVADOS QUE NO ESTÁN EN SALES_VEHICLES
SELECT 
    'PROBLEMA: RESERVADO PERO NO EN SALES_VEHICLES' as info,
    COUNT(*) as total
FROM duc_scraper ds
LEFT JOIN sales_vehicles sv ON ds."Matrícula" = sv.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND sv.license_plate IS NULL;

-- 3. VERIFICAR VEHÍCULOS RESERVADOS QUE SIGUEN EN STOCK COMO DISPONIBLES
SELECT 
    'PROBLEMA: RESERVADO PERO SIGUE EN STOCK (is_sold = false)' as info,
    COUNT(*) as total
FROM duc_scraper ds
INNER JOIN stock s ON ds."Matrícula" = s.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
AND (s.is_sold IS NULL OR s.is_sold = false);

-- 4. MOSTRAR EJEMPLOS DE VEHÍCULOS CON PROBLEMAS
SELECT 
    'EJEMPLOS DE VEHÍCULOS CON PROBLEMAS' as info,
    ds."Matrícula",
    ds."Modelo",
    ds."Disponibilidad",
    s.is_sold,
    s.mechanical_status,
    s.body_status
FROM duc_scraper ds
LEFT JOIN stock s ON ds."Matrícula" = s.license_plate
WHERE ds."Disponibilidad" ILIKE '%reservado%'
AND ds."Matrícula" IS NOT NULL
ORDER BY ds.last_seen_date DESC
LIMIT 10; 