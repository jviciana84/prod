-- Script para verificar los datos reales de fotos_asignadas
-- Ejecutar en Supabase SQL Editor

-- Ver todos los registros con información completa
SELECT 
    id,
    user_id,
    percentage,
    is_active,
    is_hidden,
    is_locked,
    display_name,
    created_at,
    updated_at
FROM fotos_asignadas
ORDER BY is_locked DESC, display_name ASC;

-- Contar registros por estado
SELECT 
    COUNT(*) as total_registros,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as activos,
    SUM(CASE WHEN is_hidden = true THEN 1 ELSE 0 END) as ocultos,
    SUM(CASE WHEN is_locked = true THEN 1 ELSE 0 END) as bloqueados
FROM fotos_asignadas;

-- Mostrar solo los bloqueados
SELECT 
    id,
    user_id,
    percentage,
    is_active,
    is_hidden,
    is_locked,
    display_name
FROM fotos_asignadas
WHERE is_locked = true
ORDER BY display_name ASC; 