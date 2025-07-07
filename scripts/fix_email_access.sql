-- Arreglar acceso a emails - dar permisos a las funciones RPC

-- Recrear función get_user_emails con permisos correctos
CREATE OR REPLACE FUNCTION get_user_emails()
RETURNS TABLE(id uuid, email text)
LANGUAGE sql
SECURITY DEFINER -- IMPORTANTE: esto permite acceder a auth.users
AS $$
  SELECT au.id, au.email::text
  FROM auth.users au
  WHERE au.email IS NOT NULL;
$$;

-- Recrear función get_user_email con permisos correctos  
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER -- IMPORTANTE: esto permite acceder a auth.users
AS $$
  SELECT au.email::text
  FROM auth.users au
  WHERE au.id = user_id
  LIMIT 1;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_user_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO authenticated;

SELECT 'Funciones RPC recreadas con permisos correctos' as resultado;
