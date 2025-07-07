-- Script más simple para crear mapeos básicos

-- Verificar usuarios existentes
SELECT 'USUARIOS DISPONIBLES:' as info;
SELECT 
    au.email,
    p.full_name,
    p.role
FROM auth.users au
JOIN profiles p ON au.id = p.id
ORDER BY p.full_name;

-- Verificar asesores únicos
SELECT 'ASESORES ÚNICOS EN ENTREGAS:' as info;
SELECT 
    asesor,
    COUNT(*) as entregas_count
FROM entregas 
WHERE asesor IS NOT NULL AND asesor != ''
GROUP BY asesor
ORDER BY entregas_count DESC;

-- Crear mapeo solo para Jordi (que sabemos que existe)
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email)
SELECT 
    au.id,
    p.full_name,
    'JordiVi',
    au.email
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE LOWER(p.full_name) LIKE '%jordi%'
AND NOT EXISTS (
    SELECT 1 FROM user_asesor_mapping 
    WHERE user_id = au.id AND asesor_alias = 'JordiVi'
);

-- Mostrar mapeos actuales
SELECT 'MAPEOS ACTUALES:' as info;
SELECT * FROM user_asesor_mapping ORDER BY created_at;
