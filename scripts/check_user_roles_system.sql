-- Verificar estructura del sistema de roles
SELECT 'Roles disponibles en el sistema:' as info;
SELECT id, name, description, created_at
FROM roles 
ORDER BY name;

-- Verificar usuarios con roles asignados
SELECT 'Usuarios con roles asignados:' as info;
SELECT 
    u.email,
    r.name as role_name,
    r.description as role_description,
    ur.created_at as role_assigned_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.email, r.name;

-- Verificar si existe el rol 'admin' o 'administrador'
SELECT 'Verificando roles de administrador:' as info;
SELECT id, name, description
FROM roles 
WHERE name ILIKE '%admin%' OR name ILIKE '%administrador%';

-- Verificar tu usuario específico (reemplaza con tu email)
SELECT 'Roles para usuarios específicos:' as info;
SELECT 
    u.email,
    u.id as user_id,
    r.name as role_name
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email IN (
    'ivan.valero@munichgroup.es',
    'joseantonio.carrasco@munichgroup.es',
    'jaime.valdivia@munichgroup.es',
    'sara.campoy@munichgroup.es',
    'maria.garcia@munichgroup.es'
)
ORDER BY u.email;
