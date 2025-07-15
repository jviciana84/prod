-- Probar la consulta exacta que está fallando en el modal
-- Esta es la consulta que genera el error 400 (Bad Request)

-- 1. Probar la consulta exacta que está fallando
SELECT id, license_plate
FROM sales_vehicles 
WHERE license_plate = '5073LKB';

-- 2. Verificar si el vehículo existe con diferentes formatos
SELECT id, license_plate, created_at
FROM sales_vehicles 
WHERE license_plate ILIKE '%5073LKB%'
   OR license_plate ILIKE '%5073%'
   OR license_plate ILIKE '%LKB%'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
  AND column_name IN ('id', 'license_plate')
ORDER BY ordinal_position;

-- 4. Verificar si hay algún problema con la tabla
SELECT COUNT(*) as total_vehiculos
FROM sales_vehicles;

-- 5. Probar con una consulta más simple
SELECT id, license_plate
FROM sales_vehicles 
LIMIT 5; 