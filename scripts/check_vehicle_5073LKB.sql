-- Verificar si el vehículo 5073LKB existe en las diferentes tablas
-- Script para diagnosticar el problema con el vehículo 5073LKB

-- 1. Buscar en sales_vehicles
SELECT 'sales_vehicles' as tabla, id, license_plate, created_at
FROM sales_vehicles 
WHERE license_plate ILIKE '%5073LKB%'
ORDER BY created_at DESC;

-- 2. Buscar en external_material_vehicles
SELECT 'external_material_vehicles' as tabla, id, license_plate, created_at
FROM external_material_vehicles 
WHERE license_plate ILIKE '%5073LKB%'
ORDER BY created_at DESC;

-- 3. Buscar en entregas (por si acaso)
SELECT 'entregas' as tabla, id, license_plate, created_at
FROM entregas 
WHERE license_plate ILIKE '%5073LKB%'
ORDER BY created_at DESC;

-- 4. Verificar la estructura de la tabla sales_vehicles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
ORDER BY ordinal_position;

-- 5. Verificar estructura de sales_vehicles
SELECT 'sales_vehicles' as tabla, 
       COUNT(*) as total_vehiculos
FROM sales_vehicles;

-- 6. Buscar vehículos similares para ver el formato
SELECT id, license_plate, created_at
FROM sales_vehicles 
WHERE license_plate LIKE '%5073%' OR license_plate LIKE '%LKB%'
ORDER BY created_at DESC
LIMIT 10; 