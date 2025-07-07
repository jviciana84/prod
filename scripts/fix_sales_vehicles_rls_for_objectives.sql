-- Asegurar que RLS esté habilitado para sales_vehicles
ALTER TABLE public.sales_vehicles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas de lectura existentes que puedan causar conflicto
DROP POLICY IF EXISTS "Allow authenticated read access for sales_vehicles" ON public.sales_vehicles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.sales_vehicles;
DROP POLICY IF EXISTS "Allow authenticated users to read sales_vehicles" ON public.sales_vehicles;

-- Crear una política que permita a los usuarios autenticados leer todas las filas
CREATE POLICY "Allow authenticated read for sales_vehicles_objectives"
ON public.sales_vehicles FOR SELECT
TO authenticated
USING (true);

-- Opcional: Si quieres que solo los administradores puedan insertar/actualizar/eliminar
-- DROP POLICY IF EXISTS "Allow admins to manage sales_vehicles" ON public.sales_vehicles;
-- CREATE POLICY "Allow admins to manage sales_vehicles"
-- ON public.sales_vehicles FOR ALL
-- TO authenticated
-- USING (EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'administrador')))
-- WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'administrador')));
