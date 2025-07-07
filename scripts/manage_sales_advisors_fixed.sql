-- Ver todos los asesores de ventas actuales
SELECT 
    p.id,
    p.full_name,
    p.alias,
    p.email,
    r.name as role_name,
    p.created_at
FROM profiles p
JOIN user_roles ur ON p.id::text = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'Asesor ventas'
ORDER BY p.full_name;

-- Función para añadir un nuevo asesor de ventas
CREATE OR REPLACE FUNCTION add_sales_advisor(
    advisor_email TEXT,
    advisor_full_name TEXT,
    advisor_alias TEXT DEFAULT NULL,
    advisor_phone TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    user_uuid UUID;
    sales_role_id INTEGER;
    result_message TEXT;
BEGIN
    -- Obtener el ID del rol "Asesor ventas"
    SELECT id INTO sales_role_id FROM roles WHERE name = 'Asesor ventas';
    
    IF sales_role_id IS NULL THEN
        RETURN 'Error: No se encontró el rol "Asesor ventas"';
    END IF;
    
    -- Verificar si el usuario ya existe
    SELECT id INTO user_uuid FROM auth.users WHERE email = advisor_email;
    
    IF user_uuid IS NULL THEN
        RETURN 'Error: No se encontró un usuario con el email ' || advisor_email || '. Debe crear primero la cuenta de usuario.';
    END IF;
    
    -- Verificar si ya tiene el rol de asesor
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_uuid::text AND role_id = sales_role_id) THEN
        RETURN 'El usuario ' || advisor_email || ' ya tiene el rol de Asesor ventas';
    END IF;
    
    -- Actualizar o insertar el perfil
    INSERT INTO profiles (id, full_name, alias, phone, email, updated_at)
    VALUES (user_uuid, advisor_full_name, advisor_alias, advisor_phone, advisor_email, NOW())
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        alias = EXCLUDED.alias,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = NOW();
    
    -- Asignar el rol de asesor de ventas
    INSERT INTO user_roles (user_id, role_id, assigned_at)
    VALUES (user_uuid::text, sales_role_id, NOW());
    
    RETURN 'Asesor de ventas añadido correctamente: ' || advisor_full_name || ' (' || advisor_email || ')';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar información de un asesor existente
CREATE OR REPLACE FUNCTION update_sales_advisor(
    advisor_email TEXT,
    new_full_name TEXT DEFAULT NULL,
    new_alias TEXT DEFAULT NULL,
    new_phone TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar el usuario por email
    SELECT au.id INTO user_uuid 
    FROM auth.users au
    WHERE au.email = advisor_email;
    
    IF user_uuid IS NULL THEN
        RETURN 'Error: No se encontró un usuario con el email ' || advisor_email;
    END IF;
    
    -- Actualizar el perfil
    UPDATE profiles SET
        full_name = COALESCE(new_full_name, full_name),
        alias = COALESCE(new_alias, alias),
        phone = COALESCE(new_phone, phone),
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN 'Asesor actualizado correctamente: ' || advisor_email;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Función simple para listar asesores
CREATE OR REPLACE FUNCTION list_sales_advisors()
RETURNS TABLE(
    advisor_id UUID,
    full_name TEXT,
    alias TEXT,
    email TEXT,
    phone TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.alias,
        p.email,
        p.phone
    FROM profiles p
    JOIN user_roles ur ON p.id::text = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'Asesor ventas'
    ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql;
