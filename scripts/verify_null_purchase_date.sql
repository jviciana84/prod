-- =====================================================
-- VERIFICAR QUE PURCHASE_DATE PERMITE NULL
-- =====================================================

-- 1. Verificar que la columna purchase_date permite NULL
SELECT '=== VERIFICAR QUE PURCHASE_DATE PERMITE NULL ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas' 
    AND column_name = 'purchase_date';

-- 2. Verificar cuántos vehículos tienen NULL en purchase_date
SELECT '=== VEHÍCULOS CON NULL EN PURCHASE_DATE ===' as info;
SELECT 
    COUNT(*) as total_vehicles,
    COUNT(purchase_date) as with_date,
    COUNT(*) - COUNT(purchase_date) as without_date
FROM nuevas_entradas;

-- 3. Mostrar algunos ejemplos de vehículos con NULL en fecha
SELECT '=== EJEMPLOS DE VEHÍCULOS SIN FECHA ===' as info;
SELECT 
    license_plate,
    model,
    purchase_date,
    CASE 
        WHEN purchase_date IS NULL THEN 'SIN FECHA - COMPLETAR MANUALMENTE'
        ELSE 'CON FECHA'
    END as status
FROM nuevas_entradas 
WHERE purchase_date IS NULL
LIMIT 10;

-- 4. Verificar que todos los BMW/MINI disponibles están en nuevas_entradas
SELECT '=== VERIFICAR QUE NO QUEDAN FALTANTES ===' as info;
SELECT 
    'Vehículos BMW/MINI disponibles en duc_scraper' as info,
    COUNT(*) as total
FROM duc_scraper 
WHERE "Marca" IN ('BMW', 'MINI') AND "Disponibilidad" = 'DISPONIBLE'
UNION ALL
SELECT 
    'Vehículos en nuevas_entradas' as info,
    COUNT(*) as total
FROM nuevas_entradas
UNION ALL
SELECT 
    'Vehículos que aún faltan' as info,
    COUNT(*) as total
FROM duc_scraper d
LEFT JOIN nuevas_entradas n ON d."Matrícula" = n.license_plate
WHERE 
    d."Marca" IN ('BMW', 'MINI') 
    AND d."Disponibilidad" = 'DISPONIBLE'
    AND d."Matrícula" IS NOT NULL 
    AND d."Modelo" IS NOT NULL
    AND d."Matrícula" != ''
    AND d."Modelo" != ''
    AND n.license_plate IS NULL;

-- 5. Verificar que la función se actualizó correctamente
SELECT '=== VERIFICAR FUNCIÓN ACTUALIZADA ===' as info;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs'
    AND routine_schema = 'public';

-- 6. Probar la función actualizada
SELECT '=== PROBAR FUNCIÓN ACTUALIZADA ===' as info;
SELECT process_filter_configs(); 