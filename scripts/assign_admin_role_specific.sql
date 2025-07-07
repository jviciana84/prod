-- Ver todos los usuarios actuales
SELECT 
    id, 
    email, 
    raw_user_meta_data,
    raw_user_meta_data ->> 'role' as current_role,
    created_at
FROM auth.users 
ORDER BY created_at;

-- PASO 1: Asignar rol de admin a un usuario específico
-- Reemplaza 'TU_EMAIL_AQUI' con tu email real de la lista de arriba

-- Ejemplo para ivan.valero@munichgroup.es (reemplaza con tu email):
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{role}', 
    '"admin"'::jsonb
)
WHERE email = 'ivan.valero@munichgroup.es';

-- PASO 2: Verificar que el cambio se aplicó correctamente
SELECT 
    id, 
    email, 
    raw_user_meta_data,
    raw_user_meta_data ->> 'role' as role_after_update
FROM auth.users 
WHERE email = 'ivan.valero@munichgroup.es';

-- PASO 3: Verificar todos los usuarios con roles
SELECT 
    email,
    raw_user_meta_data ->> 'role' as role,
    raw_user_meta_data ->> 'full_name' as full_name
FROM auth.users 
WHERE raw_user_meta_data ->> 'role' IS NOT NULL
ORDER BY email;
