ALTER TABLE public.profiles
ADD COLUMN role TEXT DEFAULT 'asesor';

-- Opcional: Si quieres que los roles existentes sean nulos y luego asignarlos manualmente
-- ALTER TABLE public.profiles
-- ADD COLUMN role TEXT;

COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario (ej. admin, asesor, etc.)';

-- Asegurarse de que la política RLS permita a los usuarios leer su propio rol
-- Si ya tienes políticas RLS en 'profiles', asegúrate de que incluyan la columna 'role'.
-- Ejemplo de política RLS para lectura (si no existe o necesita ajuste):
-- DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
-- CREATE POLICY "Enable read access for all users" ON public.profiles
-- FOR SELECT USING (true);

-- Si tienes RLS más restrictivas, asegúrate de que el usuario pueda leer su propio perfil:
-- DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
-- CREATE POLICY "Users can view their own profile" ON public.profiles
-- FOR SELECT USING (auth.uid() = id);
