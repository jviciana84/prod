-- Analizar todos los asesores únicos en la tabla entregas
SELECT 'ASESORES ÚNICOS EN ENTREGAS:' as info;

SELECT 
    asesor,
    COUNT(*) as total_entregas,
    MIN(fecha_venta) as primera_entrega,
    MAX(fecha_venta) as ultima_entrega,
    COUNT(DISTINCT matricula) as vehiculos_unicos
FROM entregas 
WHERE asesor IS NOT NULL AND asesor != ''
GROUP BY asesor
ORDER BY total_entregas DESC;

-- Ver usuarios existentes con perfiles
SELECT 'USUARIOS CON PERFILES:' as info;

SELECT 
    au.id,
    au.email,
    p.full_name,
    p.role,
    p.created_at
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE p.full_name IS NOT NULL
ORDER BY p.created_at;

-- Ver mapeos existentes
SELECT 'MAPEOS EXISTENTES:' as info;

SELECT 
    uam.email,
    uam.profile_name,
    uam.asesor_alias,
    uam.created_at
FROM user_asesor_mapping uam
ORDER BY uam.created_at;
