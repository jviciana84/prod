-- Activar logging para ver los mensajes del trigger
SET log_min_messages = NOTICE;

-- Forzar una actualización que active el trigger
UPDATE sales_vehicles 
SET 
    cyp_status = 'completado',
    photo_360_status = 'completado',
    validated = true,
    updated_at = NOW()
WHERE license_plate = '0010NBB';

-- Verificar si se creó algo
SELECT 'DESPUÉS DE FORZAR TRIGGER:' as etapa, COUNT(*) as cantidad 
FROM entregas WHERE matricula = '0010NBB';

-- Ver todos los registros de entregas para debug
SELECT 'TODOS LOS REGISTROS EN ENTREGAS:' as info, COUNT(*) as total_entregas FROM entregas;
