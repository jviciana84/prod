-- Script de prueba simple para el API de circulación
-- Ejecutar como usuario postgres para verificar permisos

-- 1. Verificar conexión y permisos básicos
SELECT current_user, current_database();

-- 2. Verificar si podemos acceder a las tablas
SELECT 'circulation_permit_requests' as tabla, COUNT(*) as registros 
FROM circulation_permit_requests
UNION ALL
SELECT 'circulation_permit_materials' as tabla, COUNT(*) as registros 
FROM circulation_permit_materials
UNION ALL
SELECT 'entregas' as tabla, COUNT(*) as registros 
FROM entregas;

-- 3. Verificar la consulta exacta que hace el API
SELECT 
  id, 
  matricula, 
  modelo, 
  asesor, 
  fecha_entrega
FROM entregas
WHERE fecha_entrega IS NOT NULL 
  AND asesor IS NOT NULL 
  AND asesor != ''
ORDER BY fecha_entrega DESC
LIMIT 5;

-- 4. Verificar si hay entregas sin solicitud
SELECT 
  COUNT(*) as entregas_sin_solicitud
FROM entregas e
LEFT JOIN circulation_permit_requests cpr ON e.id = cpr.entrega_id
WHERE e.fecha_entrega IS NOT NULL 
  AND e.asesor IS NOT NULL 
  AND e.asesor != ''
  AND cpr.id IS NULL;

-- 5. Verificar estructura de circulation_permit_requests
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'circulation_permit_requests'
ORDER BY ordinal_position;

-- 6. Verificar si hay algún trigger o constraint que pueda estar fallando
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'circulation_permit_requests'; 