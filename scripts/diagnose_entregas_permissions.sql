-- Diagnosticar problemas de permisos en tabla entregas
-- Ejecutar para identificar el problema real

-- 1. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'entregas';

-- 2. Verificar políticas existentes (si las hay)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'entregas';

-- 3. Verificar permisos de la tabla
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'entregas';

-- 4. Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'entregas'
ORDER BY ordinal_position;

-- 5. Verificar si hay triggers que puedan estar bloqueando
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'entregas';

-- 6. Verificar el usuario actual y sus roles
SELECT current_user, current_role;

-- 7. Verificar configuración de auth
SELECT * FROM auth.users LIMIT 1;
