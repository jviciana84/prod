-- Verificar si los triggers están activos
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles'
AND trigger_schema = 'public'
ORDER BY trigger_name;
