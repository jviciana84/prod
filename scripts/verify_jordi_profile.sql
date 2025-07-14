-- Script para verificar el perfil de Jordi Viciana
-- Ejecuta este script en tu base de datos Supabase

-- Verificar el perfil actual de Jordi
SELECT 'PERFIL ACTUAL DE JORDI:' as info;
SELECT 
    id,
    full_name,
    alias,
    email,
    avatar_url
FROM profiles 
WHERE full_name ILIKE '%jordi%' OR email = 'jordi.viciana@munichgroup.es';

-- Verificar si el alias 'jordivi' existe exactamente
SELECT 'VERIFICANDO ALIAS jordivi:' as info;
SELECT 
    id,
    full_name,
    alias,
    email,
    avatar_url
FROM profiles 
WHERE LOWER(alias) = 'jordivi';

-- Verificar todos los perfiles que contengan 'jordi' en cualquier campo
SELECT 'TODOS LOS PERFILES CON JORDI:' as info;
SELECT 
    id,
    full_name,
    alias,
    email,
    avatar_url
FROM profiles 
WHERE 
    LOWER(full_name) LIKE '%jordi%' OR 
    LOWER(alias) LIKE '%jordi%' OR 
    LOWER(email) LIKE '%jordi%'; 