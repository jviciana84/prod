-- Script para sincronizar el estado de resolución de incidencias
-- Este script corrige inconsistencias entre la tabla entregas y incidencias_historial

-- 1. Marcar como resueltas en historial las incidencias que ya no están en entregas.tipos_incidencia
UPDATE incidencias_historial 
SET 
  resuelta = true,
  fecha_resolucion = COALESCE(fecha_resolucion, NOW())
WHERE 
  resuelta = false 
  AND NOT EXISTS (
    SELECT 1 
    FROM entregas e 
    WHERE e.matricula = incidencias_historial.matricula 
    AND e.tipos_incidencia @> ARRAY[incidencias_historial.tipo_incidencia]::text[]
  );

-- 2. Crear registros de resolución en historial para incidencias que fueron removidas de entregas
-- pero no tienen registro de resolución
INSERT INTO incidencias_historial (
  entrega_id,
  matricula,
  tipo_incidencia,
  accion,
  usuario_id,
  usuario_nombre,
  fecha,
  comentario,
  resuelta
)
SELECT DISTINCT
  e.id::uuid as entrega_id,
  ih.matricula,
  ih.tipo_incidencia,
  'resuelta' as accion,
  NULL::uuid as usuario_id,
  'Sistema' as usuario_nombre,
  NOW() as fecha,
  'Incidencia resuelta automáticamente por sincronización' as comentario,
  true as resuelta
FROM incidencias_historial ih
JOIN entregas e ON e.matricula = ih.matricula
WHERE 
  ih.accion = 'añadida'
  AND ih.resuelta = false
  AND NOT (e.tipos_incidencia @> ARRAY[ih.tipo_incidencia]::text[])
  AND NOT EXISTS (
    SELECT 1 
    FROM incidencias_historial ih2 
    WHERE ih2.matricula = ih.matricula 
    AND ih2.tipo_incidencia = ih.tipo_incidencia 
    AND ih2.accion = 'resuelta'
  );

-- 3. Verificar el estado final
SELECT 
  'Resumen de sincronización' as descripcion,
  COUNT(*) FILTER (WHERE resuelta = true) as incidencias_resueltas,
  COUNT(*) FILTER (WHERE resuelta = false) as incidencias_pendientes,
  COUNT(*) as total_registros
FROM incidencias_historial;
