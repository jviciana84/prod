-- Script para identificar y limpiar usuarios duplicados o huérfanos

-- 1. Identificar usuarios en profiles que no están en auth.users
SELECT 
    p.id,
    p.email,
    p.full_name,
    'Profile sin auth user' as issue
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- 2. Identificar usuarios en auth.users que no están en profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    'Auth user sin profile' as issue
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 3. Identificar emails duplicados en profiles
SELECT 
    email,
    COUNT(*) as count
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- 4. Limpiar profiles huérfanos (sin auth.users correspondiente)
-- DESCOMENTA SOLO SI ESTÁS SEGURO:
-- DELETE FROM profiles 
-- WHERE id NOT IN (SELECT id FROM auth.users);

-- 5. Para crear profiles faltantes para usuarios de auth.users:
-- DESCOMENTA SOLO SI ESTÁS SEGURO:
-- INSERT INTO profiles (id, email, full_name, created_at)
-- SELECT 
--     au.id,
--     au.email,
--     COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
--     au.created_at
-- FROM auth.users au
-- LEFT JOIN profiles p ON au.id = p.id
-- WHERE p.id IS NULL;
