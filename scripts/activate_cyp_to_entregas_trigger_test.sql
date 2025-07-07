-- Actualizar el estado del vehículo 0010NBB para activar el trigger
UPDATE public.sales_vehicles
SET
    cyp_status = 'completado',
    photo_360_status = 'completado',
    validated = 'true', -- Asegúrate de que sea 'true' como string si la columna es TEXT
    cyp_date = NOW(), -- Establecer la fecha de completado
    photo_360_date = NOW(), -- Establecer la fecha de completado
    validation_date = NOW(), -- Establecer la fecha de validación
    updated_at = NOW()
WHERE license_plate = '0010NBB';

SELECT 'Intento de activar trigger para 0010NBB.' as status;
