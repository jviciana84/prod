-- =====================================================
-- CONSULTAR ESTADO ACTUAL DE FOTÓGRAFOS
-- =====================================================
-- Descripción: Muestra cómo están configurados los fotógrafos actualmente
-- =====================================================

-- 1. Consultar todos los fotógrafos asignados
SELECT 
    'FOTÓGRAFOS ASIGNADOS' as info,
    COUNT(*) as total_fotografos
FROM fotos_asignadas;

-- 2. Mostrar detalle completo de cada fotógrafo
SELECT 
    'DETALLE COMPLETO' as info,
    id,
    user_id,
    percentage as porcentaje,
    is_active as activo,
    is_hidden as oculto,
    is_locked as bloqueado,
    created_at,
    updated_at
FROM fotos_asignadas
ORDER BY percentage DESC, is_active DESC;

-- 3. Resumen por estados
SELECT 
    'RESUMEN POR ESTADOS' as info,
    COUNT(*) as total,
    SUM(percentage) as porcentaje_total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as activos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactivos,
    COUNT(CASE WHEN is_hidden = true THEN 1 END) as ocultos,
    COUNT(CASE WHEN is_locked = true THEN 1 END) as bloqueados
FROM fotos_asignadas;

-- 4. Solo fotógrafos activos y visibles
SELECT 
    'FOTÓGRAFOS ACTIVOS Y VISIBLES' as info,
    COUNT(*) as total_activos_visibles,
    SUM(percentage) as porcentaje_total_activo
FROM fotos_asignadas
WHERE is_active = true AND is_hidden = false;

-- 5. Distribución de porcentajes
SELECT 
    'DISTRIBUCIÓN DE PORCENTAJES' as info,
    percentage as porcentaje,
    COUNT(*) as cantidad_fotografos,
    STRING_AGG(user_id, ', ') as user_ids
FROM fotos_asignadas
WHERE is_active = true AND is_hidden = false
GROUP BY percentage
ORDER BY percentage DESC;

-- 6. Fotógrafos bloqueados
SELECT 
    'FOTÓGRAFOS BLOQUEADOS' as info,
    user_id,
    percentage as porcentaje_bloqueado
FROM fotos_asignadas
WHERE is_locked = true AND is_active = true AND is_hidden = false
ORDER BY percentage DESC; 