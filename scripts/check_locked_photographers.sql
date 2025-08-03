-- Script para verificar fotógrafos bloqueados
-- Ejecutar en Supabase SQL Editor

-- Ver todos los fotógrafos con su estado de bloqueo
SELECT 
    id,
    user_id,
    email,
    full_name,
    percentage,
    is_active,
    is_hidden,
    is_locked,
    created_at,
    updated_at
FROM fotos_asignadas
ORDER BY is_locked DESC, full_name ASC;

-- Contar fotógrafos bloqueados
SELECT 
    COUNT(*) as total_fotografos,
    SUM(CASE WHEN is_locked = true THEN 1 ELSE 0 END) as fotografos_bloqueados,
    SUM(CASE WHEN is_locked = true THEN percentage ELSE 0 END) as porcentaje_bloqueado
FROM fotos_asignadas;

-- Mostrar solo los fotógrafos bloqueados
SELECT 
    id,
    user_id,
    email,
    full_name,
    percentage,
    is_active,
    is_hidden,
    is_locked,
    updated_at
FROM fotos_asignadas
WHERE is_locked = true
ORDER BY full_name ASC; 