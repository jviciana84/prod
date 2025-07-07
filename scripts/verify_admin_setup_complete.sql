-- Verificación completa del setup de administradores

-- 1. Verificar usuarios con rol admin
SELECT 'Usuarios con rol admin:' as info;
SELECT 
    email,
    raw_user_meta_data ->> 'role' as role,
    raw_user_meta_data ->> 'full_name' as full_name
FROM auth.users 
WHERE raw_user_meta_data ->> 'role' IN ('admin', 'administrador');

-- 2. Verificar que la tabla email_config existe
SELECT 'Tabla email_config existe:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'email_config'
) as table_exists;

-- 3. Verificar políticas RLS de email_config
SELECT 'Políticas RLS de email_config:' as info;
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'email_config';

-- 4. Probar acceso a email_config (esto debería funcionar para usuarios admin)
SELECT 'Contenido actual de email_config:' as info;
SELECT * FROM email_config LIMIT 1;

-- 5. Verificar que RLS está habilitado
SELECT 'RLS habilitado en email_config:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'email_config';
