-- Este script comprueba las políticas de RLS en la tabla extornos.

-- 1. Listar todas las políticas para la tabla 'extornos'
SELECT
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'extornos';

-- 2. Comprobar si RLS está habilitado en la tabla
SELECT
    relname,
    relrowsecurity
FROM
    pg_class
WHERE
    relname = 'extornos';

-- Nota: El cliente de servidor de Supabase (usado en las API routes) debería
-- usar la 'service_role' y saltarse las políticas de RLS. Si la actualización
-- sigue fallando, este script nos ayudará a ver si hay alguna política
-- inesperada que lo esté bloqueando.
