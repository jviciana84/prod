-- Script para desbloquear a Iván Valero
-- Ejecutar en Supabase SQL Editor

-- Desbloquear a Iván Valero (user_id: 4cd26a1a-8af4-49ee-8e02-977d0e42af23)
UPDATE fotos_asignadas 
SET 
    is_locked = false,
    updated_at = now()
WHERE user_id = '4cd26a1a-8af4-49ee-8e02-977d0e42af23';

-- Verificar el cambio
SELECT 
    id,
    user_id,
    percentage,
    is_active,
    is_hidden,
    is_locked,
    display_name,
    p.email,
    pr.full_name
FROM fotos_asignadas fa
LEFT JOIN auth.users p ON fa.user_id = p.id
LEFT JOIN profiles pr ON fa.user_id = pr.id
WHERE fa.user_id = '4cd26a1a-8af4-49ee-8e02-977d0e42af23'; 