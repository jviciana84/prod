-- Añadir la columna created_by a la tabla extornos
ALTER TABLE public.extornos
ADD COLUMN created_by uuid NULL;

-- Opcional: Añadir una clave foránea si la tabla auth.users existe y es accesible
-- Esto asume que la tabla auth.users está en el esquema auth
ALTER TABLE public.extornos
ADD CONSTRAINT fk_created_by
FOREIGN KEY (created_by) REFERENCES auth.users(id)
ON DELETE SET NULL;

-- Opcional: Actualizar los registros existentes con un valor por defecto o nulo
-- Si tienes una forma de saber quién creó los extornos existentes, puedes actualizarlos aquí.
-- Por ejemplo, si el usuario actual es el creador de todos los extornos existentes:
-- UPDATE public.extornos SET created_by = (SELECT id FROM auth.users LIMIT 1) WHERE created_by IS NULL;
-- Por ahora, lo dejamos NULL para no forzar datos.

-- Crear una política RLS para permitir que los usuarios inserten extornos y se auto-asigne el created_by
-- Esto es importante para que los nuevos extornos registren automáticamente el creador.
-- Asegúrate de que RLS esté habilitado en la tabla extornos.
ALTER TABLE public.extornos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to insert their own extornos" ON public.extornos;
CREATE POLICY "Allow authenticated users to insert their own extornos"
ON public.extornos FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Permitir a los usuarios autenticados ver todos los extornos (ajusta según tus necesidades de seguridad)
DROP POLICY IF EXISTS "Allow authenticated users to view all extornos" ON public.extornos;
CREATE POLICY "Allow authenticated users to view all extornos"
ON public.extornos FOR SELECT
USING (true);

-- Permitir a los usuarios autenticados actualizar sus propios extornos (ajusta según tus necesidades de seguridad)
DROP POLICY IF EXISTS "Allow authenticated users to update their own extornos" ON public.extornos;
CREATE POLICY "Allow authenticated users to update their own extornos"
ON public.extornos FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Permitir a los usuarios autenticados borrar sus propios extornos (ajusta según tus necesidades de seguridad)
DROP POLICY IF EXISTS "Allow authenticated users to delete their own extornos" ON public.extornos;
CREATE POLICY "Allow authenticated users to delete their own extornos"
ON public.extornos FOR DELETE
USING (auth.uid() = created_by);

-- Si tienes un rol de 'admin' o similar, puedes añadir políticas para ellos
-- DROP POLICY IF EXISTS "Admins can manage all extornos" ON public.extornos;
-- CREATE POLICY "Admins can manage all extornos"
-- ON public.extornos
-- USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_id = (SELECT id FROM public.roles WHERE name = 'admin')))
-- WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_id = (SELECT id FROM public.roles WHERE name = 'admin')));
