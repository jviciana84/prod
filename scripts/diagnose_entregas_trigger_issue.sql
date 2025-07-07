-- Diagnosticar el problema del trigger de entregas

-- 1. Ver todos los triggers relacionados con entregas
SELECT 
    schemaname,
    tablename,
    triggername,
    triggerdef
FROM pg_triggers 
WHERE triggername ILIKE '%entrega%' 
   OR triggerdef ILIKE '%entregas%'
ORDER BY tablename, triggername;

-- 2. Ver triggers en sales_vehicles (que es donde se actualiza CyP)
SELECT 
    schemaname,
    tablename,
    triggername,
    triggerdef
FROM pg_triggers 
WHERE tablename = 'sales_vehicles'
ORDER BY triggername;

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
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'entregas';

-- 5. Verificar si RLS está realmente desactivado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasrls
FROM pg_tables 
WHERE tablename = 'entregas';

-- 6. Ver las políticas RLS (aunque estén desactivadas)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'entregas';
