-- Crear función RPC para obtener asesores únicos (para la interfaz web)
CREATE OR REPLACE FUNCTION get_unique_asesores()
RETURNS TABLE (
    asesor text,
    total_entregas bigint,
    primera_entrega date,
    ultima_entrega date,
    tiene_mapeo boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.asesor,
        COUNT(*) as total_entregas,
        MIN(e.fecha_venta::date) as primera_entrega,
        MAX(e.fecha_venta::date) as ultima_entrega,
        (uam.asesor_alias IS NOT NULL) as tiene_mapeo
    FROM entregas e
    LEFT JOIN user_asesor_mapping uam ON e.asesor = uam.asesor_alias
    WHERE e.asesor IS NOT NULL AND e.asesor != ''
    GROUP BY e.asesor, uam.asesor_alias
    ORDER BY COUNT(*) DESC;
END;
$$;

-- Crear función para obtener usuarios sin mapear
CREATE OR REPLACE FUNCTION get_users_without_mapping()
RETURNS TABLE (
    user_id uuid,
    email text,
    full_name text,
    role text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        p.full_name,
        p.role
    FROM auth.users au
    JOIN profiles p ON au.id = p.id
    LEFT JOIN user_asesor_mapping uam ON au.id = uam.user_id
    WHERE p.full_name IS NOT NULL 
    AND uam.user_id IS NULL
    ORDER BY p.created_at;
END;
$$;
