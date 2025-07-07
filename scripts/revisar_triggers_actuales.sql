-- Ver todos los triggers en sales_vehicles
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_condition
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles'
ORDER BY trigger_name;

-- Ver la función actual del trigger
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_cyp_to_entregas';
