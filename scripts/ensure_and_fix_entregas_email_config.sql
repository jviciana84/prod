-- Paso 1: Deshabilitar RLS en la tabla (si no lo está ya)
-- Esto asegura que no haya políticas RLS interfiriendo con la visibilidad de los datos.
ALTER TABLE public.entregas_email_config DISABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar todas las políticas RLS existentes para esta tabla
-- Esto es una medida de seguridad para limpiar cualquier política residual.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.entregas_email_config;
DROP POLICY IF EXISTS "Allow all authenticated users to read entregas_email_config" ON public.entregas_email_config;
-- Puedes añadir más DROP POLICY si conoces los nombres de otras políticas existentes.

-- Paso 3: Eliminar todas las filas existentes para asegurar un estado limpio
-- Esto es crucial para garantizar que solo haya una fila después de la inserción.
DELETE FROM public.entregas_email_config;

-- Paso 4: Insertar una única fila de configuración por defecto
-- Si la tabla está vacía, inserta la configuración por defecto.
INSERT INTO "public"."entregas_email_config" ("id", "enabled", "cc_emails")
VALUES (1, TRUE, '{}') -- Valores por defecto: ID 1, activado, sin emails CC
ON CONFLICT (id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    cc_emails = EXCLUDED.cc_emails;

-- Paso 5: (Opcional pero recomendado si RLS se va a mantener deshabilitado)
-- Si RLS se va a mantener deshabilitado, no necesitas políticas.
-- Si en el futuro decides habilitar RLS, necesitarás una política de SELECT.
-- Por ahora, con RLS deshabilitado, todos pueden leer.

-- Confirmar el estado de RLS y el contenido de la tabla
SELECT relrowsecurity FROM pg_class WHERE relname = 'entregas_email_config';
SELECT * FROM public.entregas_email_config;
