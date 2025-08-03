-- Script para desbloquear a Iván Valero
-- Ejecutar en Supabase SQL Editor

-- Desbloquear a Iván Valero (ID: 24, user_id: 4cd26a1a-8af4-49ee-8e02-977d0e42af23)
UPDATE fotos_asignadas 
SET 
    is_locked = false,
    updated_at = now()
WHERE id = 24;

-- Verificar que solo queda Jordi Viciana bloqueado
SELECT 
    fa.id,
    fa.user_id,
    fa.percentage,
    fa.is_active,
    fa.is_hidden,
    fa.is_locked,
    p.email,
    pr.full_name
FROM fotos_asignadas fa
LEFT JOIN auth.users p ON fa.user_id = p.id
LEFT JOIN profiles pr ON fa.user_id = pr.id
WHERE fa.is_locked = true
ORDER BY pr.full_name ASC; 