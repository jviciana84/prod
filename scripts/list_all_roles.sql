-- Script para listar todos los roles existentes en la tabla roles
SELECT 'Roles existentes en la tabla roles:' as info;
SELECT 
    id,
    name,
    description,
    created_at
FROM roles 
ORDER BY name;

-- También mostrar cuántos usuarios tienen cada rol
SELECT 'Usuarios por rol:' as info;
SELECT 
    r.name as role_name,
    COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name
ORDER BY r.name; 