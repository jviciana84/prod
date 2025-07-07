-- Diagnosticar estructura de tablas de usuarios
SELECT 'auth.users columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

SELECT 'profiles table exists?' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
) as profiles_exists;

-- Si existe profiles, mostrar su estructura
SELECT 'profiles columns (if exists):' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar si hay otras tablas relacionadas con usuarios
SELECT 'User-related tables:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%user%' OR table_name LIKE '%profile%' OR table_name LIKE '%auth%')
ORDER BY table_name;

-- Verificar estructura de auth.users (solo columnas que sabemos que existen)
SELECT 'Sample auth.users data:' as info;
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users 
LIMIT 3;

-- Verificar qué contiene raw_user_meta_data
SELECT 'User roles from raw_user_meta_data:' as info;
SELECT 
    id, 
    email, 
    raw_user_meta_data,
    raw_user_meta_data ->> 'role' as extracted_role,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;
