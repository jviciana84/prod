-- 1. Limpiar registro previo
DELETE FROM entregas WHERE matricula = '0010NBB';

-- 2. Verificar que no existe
SELECT 'Registros ANTES:' as etapa, COUNT(*) as cantidad FROM entregas WHERE matricula = '0010NBB';

-- 3. Resetear vehículo a pendiente
UPDATE sales_vehicles SET cyp_status = 'pendiente' WHERE license_plate = '0010NBB';

-- 4. Ver estado después del reset
SELECT 'Estado después del reset:' as etapa, license_plate, cyp_status FROM sales_vehicles WHERE license_plate = '0010NBB';

-- 5. Cambiar a completado (DEBE activar trigger)
UPDATE sales_vehicles SET cyp_status = 'completado' WHERE license_plate = '0010NBB';

-- 6. Ver estado final
SELECT 'Estado FINAL:' as etapa, license_plate, cyp_status FROM sales_vehicles WHERE license_plate = '0010NBB';

-- 7. Verificar si apareció en entregas
SELECT 'Registros DESPUÉS:' as etapa, COUNT(*) as cantidad FROM entregas WHERE matricula = '0010NBB';

-- 8. Ver el registro completo si existe
SELECT 'REGISTRO CREADO:' as etapa, * FROM entregas WHERE matricula = '0010NBB';
