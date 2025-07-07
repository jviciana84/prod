-- 1. Limpiar cualquier registro previo de 0010NBB en entregas
DELETE FROM entregas WHERE matricula = '0010NBB';

-- 2. Verificar que no existe
SELECT COUNT(*) as registros_antes FROM entregas WHERE matricula = '0010NBB';

-- 3. Ver estado actual del vehículo
SELECT license_plate, cyp_status FROM sales_vehicles WHERE license_plate = '0010NBB';

-- 4. Resetear a pendiente
UPDATE sales_vehicles SET cyp_status = 'pendiente' WHERE license_plate = '0010NBB';

-- 5. Verificar que cambió
SELECT license_plate, cyp_status FROM sales_vehicles WHERE license_plate = '0010NBB';

-- 6. Cambiar a completado (DEBE activar trigger)
UPDATE sales_vehicles SET cyp_status = 'completado' WHERE license_plate = '0010NBB';

-- 7. Verificar estado final del vehículo
SELECT license_plate, cyp_status FROM sales_vehicles WHERE license_plate = '0010NBB';

-- 8. VERIFICAR SI APARECIÓ EN ENTREGAS
SELECT COUNT(*) as registros_despues FROM entregas WHERE matricula = '0010NBB';

-- 9. Ver el registro completo si existe
SELECT * FROM entregas WHERE matricula = '0010NBB';
