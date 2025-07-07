-- Paso 1: Verificar si existe el rol 'admin'
DO $$
DECLARE
    admin_role_id INTEGER;
    target_user_id UUID;
BEGIN
    -- Buscar el rol admin
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    -- Si no existe, crearlo
    IF admin_role_id IS NULL THEN
        INSERT INTO roles (name, description) 
        VALUES ('admin', 'Administrador del sistema')
        RETURNING id INTO admin_role_id;
        
        RAISE NOTICE 'Rol admin creado con ID: %', admin_role_id;
    ELSE
        RAISE NOTICE 'Rol admin ya existe con ID: %', admin_role_id;
    END IF;
    
    -- Asignar rol admin a un usuario específico
    -- REEMPLAZA 'ivan.valero@munichgroup.es' con tu email real
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'ivan.valero@munichgroup.es';
    
    IF target_user_id IS NOT NULL THEN
        -- Verificar si ya tiene el rol
        IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role_id = admin_role_id) THEN
            INSERT INTO user_roles (user_id, role_id) VALUES (target_user_id, admin_role_id);
            RAISE NOTICE 'Rol admin asignado al usuario: %', target_user_id;
        ELSE
            RAISE NOTICE 'El usuario ya tiene el rol admin asignado';
        END IF;
    ELSE
        RAISE NOTICE 'Usuario no encontrado con email: ivan.valero@munichgroup.es';
    END IF;
END $$;

-- Verificar el resultado
SELECT 'Verificación final:' as info;
SELECT 
    u.email,
    r.name as role_name,
    ur.created_at as assigned_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'ivan.valero@munichgroup.es';
