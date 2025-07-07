-- Script para agregar la columna avatar_url a la tabla users
-- Ejecutar este script en Supabase SQL Editor

-- 1. Agregar la columna avatar_url a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Agregar comentario a la columna
COMMENT ON COLUMN users.avatar_url IS 'URL del avatar del usuario';

-- 3. Verificar que la columna se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND column_name = 'avatar_url';

-- 4. Sincronizar avatares existentes desde profiles
UPDATE users 
SET avatar_url = profiles.avatar_url
FROM profiles 
WHERE users.id = profiles.id 
    AND profiles.avatar_url IS NOT NULL;

-- 5. Verificar el resultado
SELECT 
    u.id,
    u.email,
    u.avatar_url as user_avatar,
    p.avatar_url as profile_avatar,
    CASE 
        WHEN u.avatar_url = p.avatar_url THEN '✅ Sincronizado'
        ELSE '❌ No sincronizado'
    END as status
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.avatar_url IS NOT NULL; 