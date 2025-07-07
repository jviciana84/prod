-- Crear mapeos específicos para usuarios conocidos (versión corregida)

-- Primero, limpiar mapeos duplicados si existen usando ROW_NUMBER()
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, asesor_alias ORDER BY created_at) as rn
    FROM user_asesor_mapping
)
DELETE FROM user_asesor_mapping 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Mapeo para Jordi (ya existe, pero por si acaso)
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email)
SELECT 
    au.id,
    p.full_name,
    'JordiVi',
    au.email
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE LOWER(p.full_name) LIKE '%jordi%'
ON CONFLICT (user_id, asesor_alias) DO UPDATE SET
    profile_name = EXCLUDED.profile_name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Mapeo para Sara (asumiendo que existe un usuario Sara)
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email)
SELECT 
    au.id,
    p.full_name,
    'SaraMe',
    au.email
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE LOWER(p.full_name) LIKE '%sara%'
ON CONFLICT (user_id, asesor_alias) DO UPDATE SET
    profile_name = EXCLUDED.profile_name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Mapeo para Javier (asumiendo que existe un usuario Javier)
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email)
SELECT 
    au.id,
    p.full_name,
    'JavierCa',
    au.email
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE LOWER(p.full_name) LIKE '%javier%'
ON CONFLICT (user_id, asesor_alias) DO UPDATE SET
    profile_name = EXCLUDED.profile_name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Mapeo para David (si existe)
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email)
SELECT 
    au.id,
    p.full_name,
    'DavidRo',
    au.email
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE LOWER(p.full_name) LIKE '%david%'
ON CONFLICT (user_id, asesor_alias) DO UPDATE SET
    profile_name = EXCLUDED.profile_name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Mapeo para Cristina (si existe)
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email)
SELECT 
    au.id,
    p.full_name,
    'CristinaGa',
    au.email
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE LOWER(p.full_name) LIKE '%cristina%'
ON CONFLICT (user_id, asesor_alias) DO UPDATE SET
    profile_name = EXCLUDED.profile_name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Mostrar resultado
SELECT 'MAPEOS CREADOS/ACTUALIZADOS:' as info;
SELECT 
    email,
    profile_name,
    asesor_alias,
    created_at,
    updated_at
FROM user_asesor_mapping
ORDER BY created_at DESC;

-- Mostrar estadísticas
SELECT 'ESTADÍSTICAS DE MAPEO:' as info;
SELECT 
    COUNT(*) as total_mapeos,
    COUNT(DISTINCT user_id) as usuarios_mapeados,
    COUNT(DISTINCT asesor_alias) as asesores_mapeados
FROM user_asesor_mapping;

-- Mostrar asesores sin mapear
SELECT 'ASESORES SIN MAPEAR:' as info;
SELECT DISTINCT asesor
FROM entregas 
WHERE asesor IS NOT NULL 
AND asesor != ''
AND asesor NOT IN (
    SELECT asesor_alias FROM user_asesor_mapping
)
ORDER BY asesor;
