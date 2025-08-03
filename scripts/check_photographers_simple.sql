-- =====================================================
-- ESTADO ACTUAL DE FOTÓGRAFOS - CONSULTA SIMPLE
-- =====================================================

-- Ver todos los fotógrafos con su configuración actual
SELECT 
    user_id,
    percentage as porcentaje,
    is_active as activo,
    is_hidden as oculto,
    is_locked as bloqueado,
    created_at,
    updated_at
FROM fotos_asignadas
ORDER BY percentage DESC;

-- Contar totales
SELECT 
    'TOTALES' as info,
    COUNT(*) as total_fotografos,
    COUNT(CASE WHEN is_active = true THEN 1 END) as activos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactivos,
    COUNT(CASE WHEN is_hidden = true THEN 1 END) as ocultos,
    COUNT(CASE WHEN is_locked = true THEN 1 END) as bloqueados
FROM fotos_asignadas;

-- Porcentaje total activo
SELECT 
    'PORCENTAJE TOTAL' as info,
    SUM(percentage) as porcentaje_total
FROM fotos_asignadas
WHERE is_active = true AND is_hidden = false; 