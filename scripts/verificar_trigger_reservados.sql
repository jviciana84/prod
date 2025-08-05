-- VERIFICAR TRIGGER PARA RESERVADOS
SELECT '=== TRIGGER PARA RESERVADOS ===' as info;

-- 1. Verificar si existe el trigger
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_handle_availability_change';

-- 2. Verificar si existe la función
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_availability_change';

-- 3. Verificar vehículos reservados en duc_scraper
SELECT COUNT(*) as reservados_en_duc
FROM duc_scraper
WHERE "Disponibilidad" ILIKE '%reservado%';

-- 4. Verificar cuántos están marcados como vendidos en stock
SELECT COUNT(*) as vendidos_en_stock
FROM stock s
JOIN duc_scraper d ON s.license_plate = d."Matrícula"
WHERE d."Disponibilidad" ILIKE '%reservado%'
AND s.is_sold = true;

-- 5. Verificar cuántos están pendientes en stock
SELECT COUNT(*) as pendientes_en_stock
FROM stock s
JOIN duc_scraper d ON s.license_plate = d."Matrícula"
WHERE d."Disponibilidad" ILIKE '%reservado%'
AND (s.is_sold IS NULL OR s.is_sold = false); 