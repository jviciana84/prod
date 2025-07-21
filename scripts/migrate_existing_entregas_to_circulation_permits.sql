-- =====================================================
-- MIGRACIÓN DE ENTREGAS EXISTENTES A PERMISOS DE CIRCULACIÓN
-- =====================================================
-- Este script migra entregas que ya tienen fecha_entrega pero no tienen solicitudes

-- 1. Verificar entregas que necesitan migración
SELECT 
    'ENTREGAS CON FECHA_ENTREGA SIN SOLICITUD' as info,
    COUNT(*) as total
FROM entregas e
LEFT JOIN circulation_permit_requests cpr ON e.id = cpr.entrega_id
WHERE e.fecha_entrega IS NOT NULL 
  AND e.asesor IS NOT NULL 
  AND e.asesor != ''
  AND cpr.id IS NULL;

-- 2. Mostrar muestra de entregas a migrar
SELECT 
    e.id,
    e.matricula,
    e.modelo,
    e.asesor,
    e.fecha_entrega,
    'PENDIENTE DE MIGRACIÓN' as estado
FROM entregas e
LEFT JOIN circulation_permit_requests cpr ON e.id = cpr.entrega_id
WHERE e.fecha_entrega IS NOT NULL 
  AND e.asesor IS NOT NULL 
  AND e.asesor != ''
  AND cpr.id IS NULL
ORDER BY e.fecha_entrega DESC
LIMIT 10;

-- 3. Migrar entregas existentes (solo las que no tienen solicitud)
INSERT INTO circulation_permit_requests (
    entrega_id,
    license_plate,
    model,
    asesor_alias,
    request_date,
    status,
    observations
)
SELECT 
    e.id,
    e.matricula,
    e.modelo,
    e.asesor,
    e.fecha_entrega,
    'pending',
    'Migrado automáticamente desde entrega existente'
FROM entregas e
LEFT JOIN circulation_permit_requests cpr ON e.id = cpr.entrega_id
WHERE e.fecha_entrega IS NOT NULL 
  AND e.asesor IS NOT NULL 
  AND e.asesor != ''
  AND cpr.id IS NULL
ON CONFLICT (entrega_id) DO NOTHING;

-- 4. Crear materiales para las solicitudes migradas
INSERT INTO circulation_permit_materials (
    circulation_permit_request_id,
    material_type,
    material_label,
    selected,
    observations
)
SELECT 
    cpr.id,
    'circulation_permit',
    'Permiso de Circulación',
    false,
    ''
FROM circulation_permit_requests cpr
LEFT JOIN circulation_permit_materials cpm ON cpr.id = cpm.circulation_permit_request_id
WHERE cpr.observations = 'Migrado automáticamente desde entrega existente'
  AND cpm.id IS NULL;

-- 5. Verificar resultado de la migración
SELECT 
    'RESULTADO DE MIGRACIÓN' as info,
    (SELECT COUNT(*) FROM circulation_permit_requests WHERE observations = 'Migrado automáticamente desde entrega existente') as solicitudes_migradas,
    (SELECT COUNT(*) FROM circulation_permit_materials cpm 
     JOIN circulation_permit_requests cpr ON cpm.circulation_permit_request_id = cpr.id 
     WHERE cpr.observations = 'Migrado automáticamente desde entrega existente') as materiales_migrados;

-- 6. Verificar que no quedan entregas sin migrar
SELECT 
    'ENTREGAS PENDIENTES DESPUÉS DE MIGRACIÓN' as info,
    COUNT(*) as total
FROM entregas e
LEFT JOIN circulation_permit_requests cpr ON e.id = cpr.entrega_id
WHERE e.fecha_entrega IS NOT NULL 
  AND e.asesor IS NOT NULL 
  AND e.asesor != ''
  AND cpr.id IS NULL;

-- 7. Mostrar estadísticas finales
SELECT 
    'ESTADÍSTICAS FINALES' as info,
    (SELECT COUNT(*) FROM circulation_permit_requests) as total_solicitudes,
    (SELECT COUNT(*) FROM circulation_permit_requests WHERE status = 'pending') as solicitudes_pendientes,
    (SELECT COUNT(*) FROM circulation_permit_requests WHERE status = 'completed') as solicitudes_completadas;

-- 8. Mensaje de confirmación
SELECT '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE' as status; 