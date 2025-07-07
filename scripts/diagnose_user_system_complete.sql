-- Diagnóstico completo del sistema de usuarios

-- 1. Ver todos los usuarios en auth.users
SELECT 
    'AUTH USERS' as tabla,
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data->>'full_name' as full_name_meta
FROM auth.users
ORDER BY created_at DESC;

-- 2. Ver todos los usuarios en profiles
SELECT 
    'PROFILES' as tabla,
    id,
    email,
    full_name,
    created_at,
    role
FROM profiles
ORDER BY created_at DESC;

-- 3. Usuarios en auth.users SIN profiles
SELECT 
    'AUTH SIN PROFILE' as issue,
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data->>'full_name' as full_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 4. Usuarios en profiles SIN auth.users
SELECT 
    'PROFILE SIN AUTH' as issue,
    p.id,
    p.email,
    p.full_name,
    p.created_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- 5. Emails duplicados en profiles
SELECT 
    'EMAIL DUPLICADO EN PROFILES' as issue,
    email,
    COUNT(*) as count,
    array_agg(id) as ids
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- 6. Emails duplicados en auth.users
SELECT 
    'EMAIL DUPLICADO EN AUTH' as issue,
    email,
    COUNT(*) as count,
    array_agg(id) as ids
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- 7. Verificar el último usuario que intentaste crear
SELECT 
    'ÚLTIMO INTENTO' as info,
    email,
    'Existe en auth.users: ' || CASE WHEN au.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as auth_status,
    'Existe en profiles: ' || CASE WHEN p.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as profile_status
FROM (
    SELECT email FROM auth.users 
    UNION 
    SELECT email FROM profiles
) emails
LEFT JOIN auth.users au ON emails.email = au.email
LEFT JOIN profiles p ON emails.email = p.email
ORDER BY emails.email;
