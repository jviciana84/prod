-- Verificar el estado real de RLS en entregas (versión simple)
SELECT 
    schemaname,
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE tablename = 'entregas';

-- Ver si hay políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'entregas';

-- Ver permisos básicos
SELECT 
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'entregas'
AND grantee = 'authenticated';
