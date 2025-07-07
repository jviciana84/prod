-- Diagnóstico completo del sistema de triggers
SELECT '=== DIAGNÓSTICO COMPLETO ===' as info;

-- 1. Verificar triggers activos
SELECT '1. TRIGGERS ACTIVOS:' as step;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles'
ORDER BY trigger_name;

-- 2. Verificar funciones existentes
SELECT '2. FUNCIONES RELACIONADAS:' as step;
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname LIKE '%cyp%' OR proname LIKE '%entregas%';

-- 3. Verificar estructura de entregas
SELECT '3. ESTRUCTURA TABLA ENTREGAS:' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'entregas'
ORDER BY ordinal_position;

-- 4. Verificar datos actuales
SELECT '4. DATOS ACTUALES:' as step;
SELECT 'Sales vehicles con 0010NBB:' as info;
SELECT license_plate, cyp_status, photo_360_status, validated, sale_date, model, advisor, or_value
FROM sales_vehicles 
WHERE license_plate = '0010NBB';

SELECT 'Entregas existentes:' as info;
SELECT COUNT(*) as total_entregas FROM entregas;
SELECT matricula FROM entregas LIMIT 5;
