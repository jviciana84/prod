-- 1. Obtener todos los asesores únicos de entregas
WITH asesor_stats AS (
    SELECT 
        asesor,
        COUNT(*) as entregas_count,
        MIN(fecha_venta) as primera_entrega,
        MAX(fecha_venta) as ultima_entrega
    FROM entregas 
    WHERE asesor IS NOT NULL AND asesor != ''
    GROUP BY asesor
    ORDER BY entregas_count DESC
),
-- 2. Obtener todos los usuarios con perfiles
user_profiles AS (
    SELECT 
        au.id as user_id,
        au.email,
        p.full_name,
        p.role,
        LOWER(p.full_name) as full_name_lower
    FROM auth.users au
    JOIN profiles p ON au.id = p.id
    WHERE p.full_name IS NOT NULL
),
-- 3. Intentar mapeos automáticos basados en coincidencias de nombres
automatic_mappings AS (
    SELECT DISTINCT
        up.user_id,
        up.email,
        up.full_name,
        ast.asesor,
        ast.entregas_count,
        CASE 
            -- Mapeos específicos conocidos
            WHEN LOWER(up.full_name) LIKE '%jordi%' AND ast.asesor = 'JordiVi' THEN 'CONFIRMED'
            WHEN LOWER(up.full_name) LIKE '%sara%' AND ast.asesor = 'SaraMe' THEN 'HIGH_CONFIDENCE'
            WHEN LOWER(up.full_name) LIKE '%javier%' AND ast.asesor = 'JavierCa' THEN 'HIGH_CONFIDENCE'
            
            -- Mapeos por iniciales (ej: "Ana María" -> "AnaMa")
            WHEN LENGTH(ast.asesor) >= 6 AND 
                 LOWER(SUBSTRING(up.full_name FROM 1 FOR LENGTH(ast.asesor)/2)) = LOWER(SUBSTRING(ast.asesor FROM 1 FOR LENGTH(ast.asesor)/2))
                 THEN 'MEDIUM_CONFIDENCE'
            
            -- Mapeos por primera palabra del nombre
            WHEN LOWER(SPLIT_PART(up.full_name, ' ', 1)) = LOWER(SUBSTRING(ast.asesor FROM 1 FOR LENGTH(SPLIT_PART(up.full_name, ' ', 1))))
                 THEN 'LOW_CONFIDENCE'
                 
            ELSE 'NEEDS_MANUAL_REVIEW'
        END as confidence_level
    FROM user_profiles up
    CROSS JOIN asesor_stats ast
    WHERE 
        -- Solo incluir mapeos con algún nivel de confianza
        CASE 
            WHEN LOWER(up.full_name) LIKE '%jordi%' AND ast.asesor = 'JordiVi' THEN true
            WHEN LOWER(up.full_name) LIKE '%sara%' AND ast.asesor = 'SaraMe' THEN true
            WHEN LOWER(up.full_name) LIKE '%javier%' AND ast.asesor = 'JavierCa' THEN true
            WHEN LENGTH(ast.asesor) >= 6 AND 
                 LOWER(SUBSTRING(up.full_name FROM 1 FOR LENGTH(ast.asesor)/2)) = LOWER(SUBSTRING(ast.asesor FROM 1 FOR LENGTH(ast.asesor)/2))
                 THEN true
            WHEN LOWER(SPLIT_PART(up.full_name, ' ', 1)) = LOWER(SUBSTRING(ast.asesor FROM 1 FOR LENGTH(SPLIT_PART(up.full_name, ' ', 1))))
                 THEN true
            ELSE false
        END
)

-- 4. Mostrar todos los asesores que necesitan mapeo
SELECT 'ASESORES QUE NECESITAN MAPEO:' as info;
SELECT 
    ast.asesor,
    ast.entregas_count,
    ast.primera_entrega,
    ast.ultima_entrega,
    CASE 
        WHEN uam.asesor_alias IS NOT NULL THEN 'YA_MAPEADO'
        WHEN am.asesor IS NOT NULL THEN 'MAPEO_SUGERIDO'
        ELSE 'SIN_MAPEO'
    END as estado
FROM asesor_stats ast
LEFT JOIN user_asesor_mapping uam ON ast.asesor = uam.asesor_alias
LEFT JOIN automatic_mappings am ON ast.asesor = am.asesor
ORDER BY ast.entregas_count DESC;

-- 5. Mostrar mapeos sugeridos
SELECT 'MAPEOS SUGERIDOS:' as info;
SELECT 
    email,
    full_name,
    asesor,
    entregas_count,
    confidence_level
FROM automatic_mappings
ORDER BY 
    CASE confidence_level
        WHEN 'CONFIRMED' THEN 1
        WHEN 'HIGH_CONFIDENCE' THEN 2
        WHEN 'MEDIUM_CONFIDENCE' THEN 3
        WHEN 'LOW_CONFIDENCE' THEN 4
        ELSE 5
    END,
    entregas_count DESC;

-- 6. Insertar mapeos automáticos con alta confianza
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email)
SELECT 
    user_id,
    full_name,
    asesor,
    email
FROM automatic_mappings
WHERE confidence_level IN ('CONFIRMED', 'HIGH_CONFIDENCE')
ON CONFLICT (user_id, asesor_alias) DO NOTHING;

-- 7. Mostrar estado final
SELECT 'ESTADO FINAL DE MAPEOS:' as info;
SELECT 
    uam.email,
    uam.profile_name,
    uam.asesor_alias,
    ast.entregas_count,
    uam.created_at
FROM user_asesor_mapping uam
JOIN asesor_stats ast ON uam.asesor_alias = ast.asesor
ORDER BY ast.entregas_count DESC;

-- 8. Mostrar asesores sin mapear
SELECT 'ASESORES SIN MAPEAR (REQUIEREN ATENCIÓN MANUAL):' as info;
SELECT 
    ast.asesor,
    ast.entregas_count,
    'Requiere mapeo manual' as accion_requerida
FROM asesor_stats ast
LEFT JOIN user_asesor_mapping uam ON ast.asesor = uam.asesor_alias
WHERE uam.asesor_alias IS NULL
ORDER BY ast.entregas_count DESC;
