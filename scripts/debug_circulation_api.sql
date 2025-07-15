-- Script de diagnóstico para el API de circulación
-- Ejecutar paso a paso para identificar el problema

-- 1. Verificar si las tablas existen
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('circulation_permit_requests', 'circulation_permit_materials')
ORDER BY table_name;

-- 2. Verificar estructura de circulation_permit_requests
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'circulation_permit_requests'
ORDER BY ordinal_position;

-- 3. Verificar estructura de circulation_permit_materials
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'circulation_permit_materials'
ORDER BY ordinal_position;

-- 4. Verificar permisos del usuario postgres
SELECT 
  grantee,
  privilege_type,
  table_name
FROM information_schema.role_table_grants 
WHERE table_name IN ('circulation_permit_requests', 'circulation_permit_materials')
AND grantee = 'postgres';

-- 5. Verificar si hay datos en circulation_permit_requests
SELECT COUNT(*) as total_requests FROM circulation_permit_requests;

-- 6. Verificar si hay datos en circulation_permit_materials
SELECT COUNT(*) as total_materials FROM circulation_permit_materials;

-- 7. Verificar entregas con fecha_entrega (como hace el API)
SELECT 
  COUNT(*) as entregas_con_fecha,
  COUNT(DISTINCT asesor) as asesores_unicos
FROM entregas 
WHERE fecha_entrega IS NOT NULL 
  AND asesor IS NOT NULL 
  AND asesor != '';

-- 8. Verificar entregas que no tienen solicitud
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
ORDER BY e.fecha_entrega DESC
LIMIT 10;

-- 9. Verificar RLS (Row Level Security) en las tablas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('circulation_permit_requests', 'circulation_permit_materials'); 