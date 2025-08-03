-- Verificar usuarios duplicados en la tabla profiles
-- Esto puede explicar por qué aparece el avatar antiguo primero

-- 1. Buscar usuarios con el mismo email
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id) as user_ids,
    array_agg(full_name) as names,
    array_agg(avatar_url) as avatars,
    array_agg(created_at) as created_dates
FROM profiles 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Buscar usuarios con el mismo full_name
SELECT 
    full_name,
    COUNT(*) as count,
    array_agg(id) as user_ids,
    array_agg(email) as emails,
    array_agg(avatar_url) as avatars,
    array_agg(created_at) as created_dates
FROM profiles 
WHERE full_name IS NOT NULL
GROUP BY full_name 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. Verificar usuarios con avatar_url que contenga el avatar antiguo
SELECT 
    id,
    email,
    full_name,
    avatar_url,
    created_at,
    updated_at
FROM profiles 
WHERE avatar_url LIKE '%11%2DXuqo5Q0YL5KqUSyKBqqlOQf7KlONdf.png%'
ORDER BY created_at DESC;

-- 4. Verificar todos los usuarios con el email viciana84@gmail.com
SELECT 
    id,
    email,
    full_name,
    avatar_url,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'viciana84@gmail.com'
ORDER BY created_at DESC;

-- 5. Verificar usuarios recientes (últimos 30 días)
SELECT 
    id,
    email,
    full_name,
    avatar_url,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC; 