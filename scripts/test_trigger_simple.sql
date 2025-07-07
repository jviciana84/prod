-- 1. Ver estado actual del vehículo
SELECT license_plate, cyp_status, photo_360_status, validated 
FROM sales_vehicles 
WHERE license_plate = '0010NBB';

-- 2. Resetear a pendiente
UPDATE sales_vehicles 
SET cyp_status = 'pendiente' 
WHERE license_plate = '0010NBB';

-- 3. Cambiar a completado (esto DEBE activar el trigger)
UPDATE sales_vehicles 
SET cyp_status = 'completado' 
WHERE license_plate = '0010NBB';

-- 4. Ver si apareció en entregas
SELECT * FROM entregas WHERE matricula = '0010NBB';

-- 5. Ver estado final del vehículo
SELECT license_plate, cyp_status, photo_360_status, validated 
FROM sales_vehicles 
WHERE license_plate = '0010NBB';
