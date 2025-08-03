-- Script para ver exactamente quiénes son los fotógrafos bloqueados activos
-- Ejecutar en Supabase SQL Editor

-- Ver los 2 fotógrafos bloqueados activos
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
WHERE fa.is_locked = true AND fa.is_active = true
ORDER BY pr.full_name ASC; 