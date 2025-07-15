-- Verificar tablas de circulation permit
-- Script para diagnosticar el error 500 del API

-- 1. Verificar si la tabla circulation_permit_requests existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'circulation_permit_requests'
) as tabla_existe;

-- 2. Verificar si la tabla circulation_permit_materials existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'circulation_permit_materials'
) as tabla_materials_existe;

-- 3. Verificar estructura de circulation_permit_requests
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'circulation_permit_requests'
ORDER BY ordinal_position;

-- 4. Verificar estructura de circulation_permit_materials
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'circulation_permit_materials'
ORDER BY ordinal_position;

-- 5. Verificar si hay datos en las tablas
SELECT 
  (SELECT COUNT(*) FROM circulation_permit_requests) as requests_count,
  (SELECT COUNT(*) FROM circulation_permit_materials) as materials_count;

-- 6. Verificar permisos de las tablas
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_name IN ('circulation_permit_requests', 'circulation_permit_materials'); 