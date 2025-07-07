-- LIMPIEZA AGRESIVA DEL SISTEMA DE USUARIOS
-- ⚠️ EJECUTAR CON CUIDADO - ESTO ELIMINARÁ DATOS

-- 1. Eliminar profiles huérfanos (sin auth.users)
DELETE FROM profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Crear profiles faltantes para usuarios de auth.users
INSERT INTO profiles (id, email, full_name, alias, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    COALESCE(au.raw_user_meta_data->>'alias', split_part(au.email, '@', 1)) as alias,
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 3. Eliminar duplicados de profiles (mantener el más reciente)
WITH duplicates AS (
    SELECT 
        email,
        id,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM profiles
    WHERE email IN (
        SELECT email 
        FROM profiles 
        GROUP BY email 
        HAVING COUNT(*) > 1
    )
)
DELETE FROM profiles 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 4. Verificar que todo esté limpio
SELECT 
    'VERIFICACIÓN FINAL' as status,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM profiles) as profiles_count,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN profiles p ON au.id = p.id WHERE p.id IS NULL) as auth_sin_profile,
    (SELECT COUNT(*) FROM profiles p LEFT JOIN auth.users au ON p.id = au.id WHERE au.id IS NULL) as profile_sin_auth;
