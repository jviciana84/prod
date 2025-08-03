-- Verificar usuarios con rol "Asesor ventas" (ID 4)
SELECT 
    p.id,
    p.full_name,
    p.alias,
    p.email,
    r.name as role_name,
    ur.role_id,
    p.created_at
FROM profiles p
JOIN user_roles ur ON p.id::text = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE ur.role_id = 4
ORDER BY p.full_name;

-- Verificar si el rol "Asesor ventas" existe
SELECT id, name, description 
FROM roles 
WHERE id = 4 OR name = 'Asesor ventas';

-- Ver todos los roles disponibles
SELECT id, name, description 
FROM roles 
ORDER BY id; 