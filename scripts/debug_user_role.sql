-- Script para diagnosticar el rol del usuario actual
-- Ejecuta esto en la consola de Supabase SQL Editor

-- 1. Verificar si existe la tabla profiles
SELECT 'Tabla profiles existe:' as info, 
       EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = 'profiles'
       ) as profiles_exists;

-- 2. Verificar estructura de la tabla profiles
SELECT 'Estructura de profiles:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Ver todos los usuarios con sus roles
SELECT 'Usuarios y roles:' as info;
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC;

-- 4. Buscar específicamente usuarios admin
SELECT 'Usuarios admin:' as info;
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at
FROM profiles p
WHERE p.role ILIKE '%admin%'
ORDER BY p.created_at DESC;

-- 5. Verificar si hay usuarios sin rol
SELECT 'Usuarios sin rol:' as info;
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at
FROM profiles p
WHERE p.role IS NULL OR p.role = ''
ORDER BY p.created_at DESC;

-- 6. Verificar roles únicos en el sistema
SELECT 'Roles únicos en el sistema:' as info;
SELECT 
    role,
    COUNT(*) as count
FROM profiles
WHERE role IS NOT NULL AND role != ''
GROUP BY role
ORDER BY count DESC; 