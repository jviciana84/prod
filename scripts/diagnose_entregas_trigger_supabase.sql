-- Diagnosticar el problema del trigger de entregas (versión Supabase)

-- 1. Ver triggers usando information_schema
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name ILIKE '%entrega%' 
   OR event_object_table = 'sales_vehicles'
ORDER BY event_object_table, trigger_name;

-- 2. Verificar estructura REAL de sales_vehicles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
ORDER BY ordinal_position;

-- 3. Verificar estructura de tabla entregas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'entregas' 
ORDER BY ordinal_position;

-- 4. Ver constraints de entregas
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'entregas';

-- 5. Verificar si RLS está activo
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'entregas';
