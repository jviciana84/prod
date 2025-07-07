-- Limpieza simple y directa

-- 1. Eliminar usuarios huérfanos en profiles (sin auth.users)
DELETE FROM profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Crear profiles para usuarios de auth que no tienen profile
INSERT INTO profiles (id, email, full_name, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Usuario'),
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 3. Verificar resultado
SELECT 'LIMPIEZA COMPLETADA' as status;
