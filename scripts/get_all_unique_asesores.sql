-- Ver todos los asesores únicos y cuántas entregas tienen
SELECT 
    asesor,
    COUNT(*) as entregas_count
FROM entregas 
WHERE asesor IS NOT NULL 
    AND asesor != ''
GROUP BY asesor
ORDER BY entregas_count DESC;

-- Ver todos los usuarios registrados
SELECT 
    p.id as user_id,
    p.full_name,
    p.role,
    au.email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.full_name IS NOT NULL
ORDER BY p.full_name;

-- Ver mapeos existentes
SELECT * FROM user_asesor_mapping WHERE active = true;
