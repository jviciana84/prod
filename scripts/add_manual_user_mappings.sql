-- Mapeos manuales adicionales basados en los datos que vemos
-- Ajusta estos según los usuarios reales que tengas

-- Ejemplo para Sara (ajustar email real)
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email)
SELECT 
    au.id,
    p.full_name,
    'SaraMe',
    au.email
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE (
    LOWER(p.full_name) LIKE '%sara%' OR 
    LOWER(au.email) LIKE '%sara%'
)
AND NOT EXISTS (
    SELECT 1 FROM user_asesor_mapping 
    WHERE user_id = au.id AND asesor_alias = 'SaraMe'
)
LIMIT 1
ON CONFLICT DO NOTHING;

-- Ejemplo para Javier (ajustar email real)
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email)
SELECT 
    au.id,
    p.full_name,
    'JavierCa',
    au.email
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE (
    LOWER(p.full_name) LIKE '%javier%' OR 
    LOWER(au.email) LIKE '%javier%'
)
AND NOT EXISTS (
    SELECT 1 FROM user_asesor_mapping 
    WHERE user_id = au.id AND asesor_alias = 'JavierCa'
)
LIMIT 1
ON CONFLICT DO NOTHING;

-- Ver todos los asesores que aún no tienen mapeo
SELECT 'Asesores sin mapeo:' as info;
SELECT DISTINCT e.asesor
FROM entregas e
WHERE e.asesor IS NOT NULL 
AND e.asesor != ''
AND NOT EXISTS (
    SELECT 1 FROM user_asesor_mapping uam 
    WHERE uam.asesor_alias = e.asesor
)
ORDER BY e.asesor;

-- Ver el estado final
SELECT 'Mapeos finales:' as info;
SELECT 
    uam.email,
    uam.profile_name,
    uam.asesor_alias,
    COUNT(e.id) as entregas_count
FROM user_asesor_mapping uam
LEFT JOIN entregas e ON e.asesor = uam.asesor_alias
GROUP BY uam.email, uam.profile_name, uam.asesor_alias
ORDER BY entregas_count DESC;
