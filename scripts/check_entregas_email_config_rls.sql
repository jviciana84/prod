-- Verificar si RLS está habilitado en la tabla
SELECT relrowsecurity FROM pg_class WHERE relname = 'entregas_email_config';

-- Listar todas las políticas RLS para la tabla entregas_email_config
SELECT
    polname AS policy_name,
    permissive,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression,
    (SELECT array_agg(rolname) FROM pg_catalog.pg_roles WHERE oid = ANY(polroles)) AS roles
FROM
    pg_policy
WHERE
    polrelid = (SELECT oid FROM pg_class WHERE relname = 'entregas_email_config');

-- Opcional: Si RLS está habilitado y quieres deshabilitarlo explícitamente
-- ALTER TABLE public.entregas_email_config DISABLE ROW LEVEL SECURITY;

-- Opcional: Si RLS está habilitado y quieres añadir una política de SELECT para todos (anon y authenticated)
-- CREATE POLICY "Enable read access for all users" ON public.entregas_email_config FOR SELECT USING (true);
