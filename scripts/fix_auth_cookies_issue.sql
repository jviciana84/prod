-- Script para limpiar posibles problemas de autenticación
-- Esto ayudará con el problema de cookies corruptas

-- Verificar la configuración de autenticación actual
SELECT 
    name,
    setting,
    category,
    short_desc
FROM pg_settings 
WHERE name LIKE '%auth%' OR name LIKE '%jwt%'
ORDER BY name;

-- Verificar que las funciones de autenticación funcionan
SELECT auth.role();
SELECT auth.uid();

-- Verificar usuarios activos
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users 
WHERE deleted_at IS NULL
ORDER BY last_sign_in_at DESC
LIMIT 5;
