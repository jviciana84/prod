-- Verificar que el trigger que inserta en entregas funciona correctamente
-- Buscar triggers relacionados con entregas
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    t.tgenabled as enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('sales_vehicles', 'entregas')
ORDER BY c.relname, t.tgname;

-- Ver el código de las funciones de trigger
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname LIKE '%entrega%' OR p.proname LIKE '%sales%'
ORDER BY p.proname;
