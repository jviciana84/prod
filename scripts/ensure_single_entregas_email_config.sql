-- Eliminar todas las filas existentes en entregas_email_config
DELETE FROM public.entregas_email_config;

-- Insertar una configuración por defecto si la tabla está vacía
INSERT INTO public.entregas_email_config (id, enabled, cc_emails)
SELECT 1, TRUE, ARRAY[]::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.entregas_email_config WHERE id = 1);

-- Opcional: Si la tabla tiene más columnas, asegúrate de incluirlas con valores por defecto.
-- Por ejemplo, si tu tabla tiene 'sender_email' y 'sender_name':
-- INSERT INTO public.entregas_email_config (id, enabled, cc_emails, sender_email, sender_name)
-- SELECT 1, TRUE, ARRAY[]::text[], 'entrega@controlvo.ovh', 'Sistema CVO - Entregas'
-- WHERE NOT EXISTS (SELECT 1 FROM public.entregas_email_config WHERE id = 1);

-- Asegurarse de que las políticas RLS permitan la inserción/actualización por administradores
-- Esto es un recordatorio, las políticas RLS deben configurarse en Supabase UI o en un script de migración.
-- Ejemplo (si no están ya):
-- ALTER TABLE public.entregas_email_config ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow admin to manage entregas_email_config" ON public.entregas_email_config;
-- CREATE POLICY "Allow admin to manage entregas_email_config" ON public.entregas_email_config
--   FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'administrador')));

-- Si necesitas verificar la estructura de la tabla:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'entregas_email_config';
