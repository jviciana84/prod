-- Script simple para limpiar el sistema de incidencias

-- 1. Eliminar la tabla de historial de incidencias
DROP TABLE IF EXISTS incidencias_historial CASCADE;

-- 2. Limpiar las columnas de incidencias en la tabla entregas
UPDATE entregas 
SET 
  tipos_incidencia = NULL,
  incidencia = false,
  estados_incidencia = NULL
WHERE tipos_incidencia IS NOT NULL 
   OR incidencia = true 
   OR estados_incidencia IS NOT NULL;

-- 3. Verificar que se limpiaron correctamente
SELECT 
  COUNT(*) as total_entregas,
  COUNT(CASE WHEN tipos_incidencia IS NOT NULL THEN 1 END) as con_tipos_incidencia,
  COUNT(CASE WHEN incidencia = true THEN 1 END) as con_incidencia_true,
  COUNT(CASE WHEN estados_incidencia IS NOT NULL THEN 1 END) as con_estados_incidencia
FROM entregas;

SELECT 'Limpieza completada' as resultado;
