-- Añadir la columna 'concesionario' a la tabla 'sales_vehicles' si no existe
ALTER TABLE public.sales_vehicles
ADD COLUMN IF NOT EXISTS concesionario TEXT;

-- Opcional: Si tienes datos existentes y quieres asignar un concesionario por defecto
-- o basado en alguna lógica (ej. si el usuario que creó la venta pertenece a un concesionario)
-- UPDATE public.sales_vehicles
-- SET concesionario = 'Motor Munich' -- O el valor por defecto que desees
-- WHERE concesionario IS NULL;
