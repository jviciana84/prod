-- Script para identificar al usuario con 0% bloqueado
-- Ejecutar en Supabase SQL Editor

-- Ver información completa del usuario con 0% bloqueado
SELECT 
    fa.id,
    fa.user_id,
    fa.percentage,
    fa.is_active,
    fa.is_hidden,
    fa.is_locked,
    fa.display_name,
    p.email,
    pr.full_name,
    p.avatar_url
FROM fotos_asignadas fa
LEFT JOIN auth.users p ON fa.user_id = p.id
LEFT JOIN profiles pr ON fa.user_id = pr.id
WHERE fa.percentage = 0 AND fa.is_locked = true;

-- Ver todos los usuarios para comparar
SELECT 
    fa.id,
    fa.user_id,
    fa.percentage,
    fa.is_active,
    fa.is_hidden,
    fa.is_locked,
    fa.display_name,
    p.email,
    pr.full_name
FROM fotos_asignadas fa
LEFT JOIN auth.users p ON fa.user_id = p.id
LEFT JOIN profiles pr ON fa.user_id = pr.id
ORDER BY fa.percentage ASC, pr.full_name ASC; 