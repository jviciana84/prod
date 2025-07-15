-- Verificar entregas con fecha de entrega
-- Script para diagnosticar el problema del API de sincronización

-- 1. Verificar estructura de la tabla entregas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'entregas' 
  AND column_name IN ('id', 'matricula', 'modelo', 'asesor', 'fecha_entrega')
ORDER BY ordinal_position;

-- 2. Contar total de entregas
SELECT COUNT(*) as total_entregas
FROM entregas;

-- 3. Contar entregas con fecha_entrega
SELECT COUNT(*) as entregas_con_fecha
FROM entregas 
WHERE fecha_entrega IS NOT NULL;

-- 4. Contar entregas con asesor
SELECT COUNT(*) as entregas_con_asesor
FROM entregas 
WHERE asesor IS NOT NULL AND asesor != '';

-- 5. Contar entregas que cumplen todos los criterios
SELECT COUNT(*) as entregas_validas
FROM entregas 
WHERE asesor IS NOT NULL 
  AND asesor != ''
  AND fecha_entrega IS NOT NULL;

-- 6. Ver muestra de entregas válidas
SELECT id, matricula, modelo, asesor, fecha_entrega
FROM entregas 
WHERE asesor IS NOT NULL 
  AND asesor != ''
  AND fecha_entrega IS NOT NULL
ORDER BY fecha_entrega DESC
LIMIT 10;

-- 7. Verificar si hay solicitudes existentes
SELECT COUNT(*) as solicitudes_existentes
FROM circulation_permit_requests;

-- 8. Verificar estructura de circulation_permit_requests
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'circulation_permit_requests' 
  AND column_name IN ('id', 'entrega_id', 'license_plate', 'asesor_alias')
ORDER BY ordinal_position; 