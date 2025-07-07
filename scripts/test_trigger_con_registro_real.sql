-- Ahora que sabemos que 0010NBB existe, vamos a probarlo
-- 1. Ver estado actual
SELECT 
    'ESTADO ACTUAL 0010NBB:' as info,
    license_plate,
    cyp_status,
    photo_360_status,
    validated
FROM sales_vehicles 
WHERE license_plate = '0010NBB';

-- 2. Limpiar entregas previas
DELETE FROM entregas WHERE matricula = '0010NBB';

-- 3. Resetear a pendiente
UPDATE sales_vehicles 
SET cyp_status = 'pendiente' 
WHERE license_plate = '0010NBB';

-- 4. Activar logging
SET log_min_messages = NOTICE;

-- 5. Actualizar para activar trigger
UPDATE sales_vehicles 
SET 
    cyp_status = 'completado',
    photo_360_status = 'completado',
    validated = true,
    updated_at = NOW()
WHERE license_plate = '0010NBB';

-- 6. Verificar resultado
SELECT 'RESULTADO:' as info, COUNT(*) as registros_creados 
FROM entregas WHERE matricula = '0010NBB';

-- 7. Ver el registro si se creó
SELECT * FROM entregas WHERE matricula = '0010NBB';
