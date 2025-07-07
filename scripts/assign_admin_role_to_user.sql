-- Verificar usuarios actuales y sus roles
SELECT 
    id, 
    email, 
    raw_user_meta_data,
    raw_user_meta_data ->> 'role' as current_role,
    created_at
FROM auth.users 
ORDER BY created_at;

-- Para asignar rol de admin a un usuario específico, reemplaza 'tu-email@ejemplo.com' con el email real
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--     COALESCE(raw_user_meta_data, '{}'::jsonb), 
--     '{role}', 
--     '"admin"'::jsonb
-- )
-- WHERE email = 'tu-email@ejemplo.com';

-- Verificar que el cambio se aplicó
-- SELECT 
--     id, 
--     email, 
--     raw_user_meta_data ->> 'role' as role_after_update
-- FROM auth.users 
-- WHERE email = 'tu-email@ejemplo.com';

-- Instrucciones:
-- 1. Primero ejecuta la consulta SELECT para ver los usuarios actuales
-- 2. Descomenta las líneas UPDATE y la última SELECT
-- 3. Reemplaza 'tu-email@ejemplo.com' con tu email real
-- 4. Ejecuta el script completo
