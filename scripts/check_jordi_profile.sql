-- Verificar el perfil del usuario Jordi Viciana
-- Script para diagnosticar el problema del email

-- 1. Buscar el perfil de Jordi Viciana
SELECT id, alias, full_name, email, avatar_url, created_at
FROM profiles 
WHERE alias ILIKE '%jordi%' 
   OR full_name ILIKE '%jordi%'
   OR full_name ILIKE '%viciana%'
ORDER BY created_at DESC;

-- 2. Buscar por alias exacto
SELECT id, alias, full_name, email, avatar_url, created_at
FROM profiles 
WHERE alias = 'JordiVi';

-- 3. Verificar si hay otros usuarios con email
SELECT id, alias, full_name, email, created_at
FROM profiles 
WHERE email IS NOT NULL 
  AND email != ''
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar la estructura de la tabla profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('id', 'alias', 'full_name', 'email')
ORDER BY ordinal_position; 