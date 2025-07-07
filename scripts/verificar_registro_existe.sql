-- Verificar si el registro 0010NBB existe
SELECT 'REGISTRO 0010NBB EXISTE:' as info, COUNT(*) as existe 
FROM sales_vehicles WHERE license_plate = '0010NBB';

-- Ver TODOS los registros de sales_vehicles para debug
SELECT 'TOTAL REGISTROS EN SALES_VEHICLES:' as info, COUNT(*) as total 
FROM sales_vehicles;

-- Ver las últimas 5 matrículas para verificar formato
SELECT 'ÚLTIMAS 5 MATRÍCULAS:' as info, license_plate 
FROM sales_vehicles 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar si hay registros con matrícula similar
SELECT 'MATRÍCULAS SIMILARES A 0010NBB:' as info, license_plate 
FROM sales_vehicles 
WHERE license_plate ILIKE '%0010%' OR license_plate ILIKE '%NBB%';
