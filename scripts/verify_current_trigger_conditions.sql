-- Verificar las condiciones actuales del trigger
SELECT '=== CONDICIONES ACTUALES DEL TRIGGER ===' as info;

-- Ver la función actual
SELECT pg_get_functiondef(oid) as funcion_actual
FROM pg_proc 
WHERE proname = 'handle_cyp_to_entregas_final';

-- Verificar qué condiciones se están usando
SELECT '
CONDICIONES ACTUALES:
✅ cyp_status = ''completado''
✅ photo_360_status = ''completado''
❓ validated = ??? (no incluida actualmente)
' as condiciones_actuales;

-- Verificar el registro 0010NBB
SELECT 
    'REGISTRO 0010NBB:' as info,
    license_plate,
    cyp_status,
    photo_360_status,
    validated,
    CASE 
        WHEN validated IS TRUE THEN '✅ VALIDADO'
        WHEN validated IS FALSE THEN '❌ NO VALIDADO'
        ELSE '❓ NULL'
    END as estado_validacion
FROM sales_vehicles 
WHERE license_plate = '0010NBB';
