-- Investigar el problema con "2ª llave"
-- Verificar cómo aparece este tipo de incidencia en la base de datos

-- 1. Ver todos los tipos de incidencia únicos en entregas
SELECT DISTINCT 
  unnest(tipos_incidencia) as tipo_incidencia,
  COUNT(*) as cantidad
FROM entregas 
WHERE tipos_incidencia IS NOT NULL 
  AND array_length(tipos_incidencia, 1) > 0
GROUP BY unnest(tipos_incidencia)
ORDER BY cantidad DESC;

-- 2. Ver específicamente registros que contienen "llave"
SELECT 
  id,
  matricula,
  tipos_incidencia,
  fecha_venta,
  incidencia
FROM entregas 
WHERE tipos_incidencia::text ILIKE '%llave%'
ORDER BY fecha_venta DESC;

-- 3. Ver en historial de incidencias
SELECT DISTINCT 
  tipo_incidencia,
  COUNT(*) as cantidad
FROM incidencias_historial 
WHERE tipo_incidencia ILIKE '%llave%'
GROUP BY tipo_incidencia
ORDER BY cantidad DESC;

-- 4. Verificar entregas del último mes con incidencias
SELECT 
  id,
  matricula,
  tipos_incidencia,
  fecha_venta,
  incidencia
FROM entregas 
WHERE fecha_venta >= NOW() - INTERVAL '30 days'
  AND incidencia = true
  AND tipos_incidencia IS NOT NULL
ORDER BY fecha_venta DESC;
