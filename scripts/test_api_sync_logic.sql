-- Script que simula exactamente la lógica del API de sincronización
-- Ejecutar paso a paso para identificar dónde falla

-- 1. Verificar si la tabla existe (línea 18-25 del API)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'circulation_permit_requests'
    ) THEN 'EXISTE'
    ELSE 'NO EXISTE'
  END as tabla_circulation_permit_requests;

-- 2. Verificar si podemos hacer SELECT en la tabla (línea 18-25 del API)
SELECT COUNT(*) as registros_existentes 
FROM circulation_permit_requests;

-- 3. Obtener entregas con fecha_entrega (línea 28-35 del API)
SELECT 
  COUNT(*) as total_entregas_con_fecha
FROM entregas
WHERE fecha_entrega IS NOT NULL 
  AND asesor IS NOT NULL 
  AND asesor != '';

-- 4. Mostrar muestra de entregas (línea 40-42 del API)
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

-- 5. Obtener solicitudes existentes (línea 50-57 del API)
SELECT 
  COUNT(*) as solicitudes_existentes,
  COUNT(DISTINCT entrega_id) as entregas_con_solicitud
FROM circulation_permit_requests;

-- 6. Verificar entregas sin solicitud (línea 62-65 del API)
SELECT 
  e.id,
  e.matricula,
  e.modelo,
  e.asesor,
  e.fecha_entrega,
  CASE WHEN cpr.id IS NULL THEN 'SIN SOLICITUD' ELSE 'CON SOLICITUD' END as estado
FROM entregas e
LEFT JOIN circulation_permit_requests cpr ON e.id = cpr.entrega_id
WHERE e.fecha_entrega IS NOT NULL 
  AND e.asesor IS NOT NULL 
  AND e.asesor != ''
  AND cpr.id IS NULL
ORDER BY e.fecha_entrega DESC
LIMIT 10;

-- 7. Verificar estructura de circulation_permit_requests para INSERT
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'circulation_permit_requests'
ORDER BY ordinal_position;

-- 8. Verificar si hay constraints que puedan fallar
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'circulation_permit_requests';

-- 9. Verificar si hay triggers que puedan fallar
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'circulation_permit_requests';

-- 10. Verificar permisos del usuario actual
SELECT 
  current_user,
  session_user,
  current_database();

-- 11. Verificar si hay RLS activo
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'circulation_permit_requests'; 