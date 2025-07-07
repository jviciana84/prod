-- Asegúrate de que la columna 'matricula' en 'entregas' tenga el mismo tipo de datos que 'license_plate' en 'sales_vehicles'
-- y que 'license_plate' en 'sales_vehicles' sea UNIQUE o PRIMARY KEY.

ALTER TABLE public.entregas
ADD CONSTRAINT fk_entregas_sales_vehicles
FOREIGN KEY (matricula) REFERENCES public.sales_vehicles (license_plate);

-- Opcional: Si ya existen datos en 'entregas' que no tienen una 'matricula' válida en 'sales_vehicles',
-- la adición de la FK fallará. En ese caso, podrías necesitar limpiar o actualizar esos datos primero.
-- Por ejemplo, para eliminar filas en 'entregas' sin una 'matricula' correspondiente en 'sales_vehicles':
-- DELETE FROM public.entregas
-- WHERE NOT EXISTS (SELECT 1 FROM public.sales_vehicles WHERE sales_vehicles.license_plate = entregas.matricula);

-- Después de añadir la FK, Supabase debería detectar la relación automáticamente.
-- Si no lo hace, a veces es útil refrescar el esquema en la interfaz de Supabase o reiniciar el servidor de desarrollo.
