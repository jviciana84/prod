-- Script para asignar roles de admin a múltiples usuarios

-- Opción 1: Asignar admin a usuarios específicos por email
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{role}', 
    '"admin"'::jsonb
)
WHERE email IN (
    'ivan.valero@munichgroup.es',
    'joseantonio.carrasco@munichgroup.es'
    -- Agrega más emails según necesites
);

-- Opción 2: Asignar admin al primer usuario (más antiguo)
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--     COALESCE(raw_user_meta_data, '{}'::jsonb), 
--     '{role}', 
--     '"admin"'::jsonb
-- )
-- WHERE id = (
--     SELECT id FROM auth.users 
--     ORDER BY created_at ASC 
--     LIMIT 1
-- );

-- Verificar cambios
SELECT 
    email,
    raw_user_meta_data ->> 'role' as role,
    raw_user_meta_data ->> 'full_name' as full_name,
    created_at
FROM auth.users 
ORDER BY created_at;
