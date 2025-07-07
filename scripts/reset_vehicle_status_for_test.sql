-- Resetear el estado del vehículo 0010NBB para poder probar el trigger
UPDATE public.sales_vehicles
SET
    cyp_status = 'pendiente',
    photo_360_status = 'pendiente',
    validated = 'false', -- Asegúrate de que sea 'false' como string si la columna es TEXT
    updated_at = NOW()
WHERE license_plate = '0010NBB';

SELECT 'Estado de 0010NBB reseteado a pendiente para prueba.' as status;
