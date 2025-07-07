-- Habilitar Row Level Security en la tabla 'entregas'
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

-- Eliminar cualquier política existente para evitar conflictos
DROP POLICY IF EXISTS "Allow users to view their own deliveries" ON public.entregas;

-- Crear una política que permite a los usuarios ver sus propias entregas
-- y a los usuarios con rol de 'admin' o 'administrador' ver todas las entregas.
CREATE POLICY "Allow users to view their own deliveries"
ON public.entregas FOR SELECT
USING (
  (
    -- Condición para usuarios regulares: 'asesor' coincide con su 'full_name' del perfil
    asesor = (
      SELECT p.full_name
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  )
  OR
  (
    -- Condición para usuarios administradores: verificar si el usuario tiene un rol de administrador
    auth.uid() IN (
      SELECT ur.user_id
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'administrador') -- Asumiendo estos son los nombres de los roles de administrador
    )
  )
);

-- Opcional: Asegurarse de que la política se aplique también a las operaciones de INSERT, UPDATE, DELETE
-- Si quieres que los usuarios solo puedan modificar sus propias entregas, puedes añadir políticas similares para esas operaciones.
-- Por ejemplo, para INSERT:
-- CREATE POLICY "Allow users to insert their own deliveries"
-- ON public.entregas FOR INSERT
-- WITH CHECK (
--   asesor = (
--     SELECT p.full_name
--     FROM public.profiles p
--     WHERE p.id = auth.uid()
--   )
-- );

-- Para UPDATE:
-- CREATE POLICY "Allow users to update their own deliveries"
-- ON public.entregas FOR UPDATE
-- USING (
--   asesor = (
--     SELECT p.full_name
--     FROM public.profiles p
--     WHERE p.id = auth.uid()
--   )
-- )
-- WITH CHECK (
--   asesor = (
--     SELECT p.full_name
--     FROM public.profiles p
--     WHERE p.id = auth.uid()
--   )
-- );

-- Para DELETE:
-- CREATE POLICY "Allow users to delete their own deliveries"
-- ON public.entregas FOR DELETE
-- USING (
--   asesor = (
--     SELECT p.full_name
--     FROM public.profiles p
--     WHERE p.id = auth.uid()
--   )
-- );
