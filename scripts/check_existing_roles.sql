-- Script para verificar qué roles existen actualmente en la base de datos
-- Ejecutar este script para ver el estado actual de los roles

-- 1. Verificar si existe la tabla roles
SELECT 'Verificando existencia de tabla roles:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') 
        THEN '✅ Tabla roles existe'
        ELSE '❌ Tabla roles NO existe'
    END as table_status;

-- 2. Si existe la tabla, mostrar todos los roles
SELECT 'Roles existentes en la tabla roles:' as info;
SELECT 
    id,
    name,
    description,
    created_at
FROM roles 
ORDER BY name;

-- 3. Verificar roles específicos que usa el código
SELECT 'Verificación de roles críticos para el código:' as info;
SELECT 
    'admin' as role_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM roles WHERE LOWER(name) = 'admin') THEN '✅ Existe'
        ELSE '❌ NO existe'
    END as status,
    (SELECT name FROM roles WHERE LOWER(name) = 'admin' LIMIT 1) as exact_name
UNION ALL
SELECT 
    'supervisor' as role_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM roles WHERE LOWER(name) = 'supervisor') THEN '✅ Existe'
        ELSE '❌ NO existe'
    END as status,
    (SELECT name FROM roles WHERE LOWER(name) = 'supervisor' LIMIT 1) as exact_name
UNION ALL
SELECT 
    'director' as role_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM roles WHERE LOWER(name) = 'director') THEN '✅ Existe'
        ELSE '❌ NO existe'
    END as status,
    (SELECT name FROM roles WHERE LOWER(name) = 'director' LIMIT 1) as exact_name;

-- 4. Mostrar todos los roles con búsqueda insensible a mayúsculas
SELECT 'Todos los roles (búsqueda insensible):' as info;
SELECT 
    name as exact_name,
    LOWER(name) as lowercase_name,
    description
FROM roles 
ORDER BY LOWER(name);

-- 5. Verificar usuarios con roles asignados
SELECT 'Usuarios con roles asignados (primeros 10):' as info;
SELECT 
    u.email,
    r.name as role_name,
    ur.created_at as assigned_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.email
LIMIT 10; 