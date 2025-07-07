-- Paso 1: Resetear el estado del vehículo 0010NBB en sales_vehicles
UPDATE public.sales_vehicles
SET 
    cyp_status = 'pendiente',
    photo_360_status = 'pendiente',
    validated = FALSE, -- Aseguramos que sea FALSE booleano
    cyp_date = NULL,
    photo_360_date = NULL,
    validation_date = NULL,
    updated_at = NOW()
WHERE license_plate = '0010NBB';

-- Paso 2: Actualizar el estado del vehículo para activar el trigger
-- Esto debería activar el trigger cyp_to_entregas_trigger
UPDATE public.sales_vehicles
SET 
    cyp_status = 'completado',
    photo_360_status = 'completado',
    validated = TRUE, -- Aseguramos que sea TRUE booleano
    cyp_date = NOW(),
    photo_360_date = NOW(),
    validation_date = NOW(),
    updated_at = NOW()
WHERE license_plate = '0010NBB';

-- Paso 3: Verificar el registro en la tabla entregas
SELECT *
FROM public.entregas
WHERE matricula = '0010NBB';
