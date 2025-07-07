-- Verificar si el trigger existe en la tabla sales_vehicles
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles' 
AND trigger_schema = 'public';

-- Verificar si la función existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_cyp_to_entregas' 
AND routine_schema = 'public';

-- Ver todos los triggers de la tabla sales_vehicles (consulta corregida)
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.relname = 'sales_vehicles'
AND NOT t.tgisinternal;
