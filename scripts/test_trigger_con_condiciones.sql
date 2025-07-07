-- Limpiar entregas de pruebas anteriores
DELETE FROM entregas WHERE matricula LIKE '%TEST%' OR matricula = 'TRIGGER_0010NBB';

-- Actualizar el vehículo 0010NBB para que cumpla TODAS las condiciones
UPDATE sales_vehicles 
SET 
    cyp_status = 'completado',
    photo_360_status = 'completado',
    validated = true,
    updated_at = NOW()
WHERE license_plate = '0010NBB';

-- Verificar resultado
SELECT 'DESPUÉS DE TRIGGER CON CONDICIONES:' as etapa, COUNT(*) as cantidad 
FROM entregas WHERE matricula = '0010NBB';

-- Ver el registro creado
SELECT * FROM entregas WHERE matricula = '0010NBB' ORDER BY created_at DESC LIMIT 1;
