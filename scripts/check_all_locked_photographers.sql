-- Script para verificar todos los fotógrafos bloqueados
-- Ejecutar en Supabase SQL Editor

-- Ver todos los fotógrafos bloqueados con información completa
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
WHERE fa.is_locked = true
ORDER BY pr.full_name ASC;

-- Contar total de bloqueados
SELECT 
    COUNT(*) as total_bloqueados,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as bloqueados_activos,
    SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as bloqueados_inactivos
FROM fotos_asignadas
WHERE is_locked = true; 