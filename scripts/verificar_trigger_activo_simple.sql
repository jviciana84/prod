-- Verificar si el trigger existe
SELECT 
    'TRIGGER EXISTE:' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles' 
AND trigger_schema = 'public';

-- Verificar si la función existe
SELECT 
    'FUNCIÓN EXISTE:' as info,
    routine_name, 
    routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%cyp%' 
AND routine_schema = 'public';
