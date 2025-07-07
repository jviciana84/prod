-- Crear mapeos específicos para usuarios conocidos
-- Ajusta estos mapeos según los datos que veas en el análisis anterior

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
ON CONFLICT (user_id, asesor_alias) DO NOTHING;

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
ON CONFLICT (user_id, asesor_alias) DO NOTHING;

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
ON CONFLICT (user_id, asesor_alias) DO NOTHING;

-- Mostrar resultado
SELECT 'MAPEOS CREADOS:' as info;
SELECT 
    email,
    profile_name,
    asesor_alias,
    created_at
FROM user_asesor_mapping
ORDER BY created_at DESC;
