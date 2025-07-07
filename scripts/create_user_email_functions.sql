-- Crear funciones RPC para obtener emails de usuarios
-- Estas funciones permiten acceder a la información de auth.users de forma segura

-- Función para obtener todos los emails de usuarios
CREATE OR REPLACE FUNCTION get_user_emails()
RETURNS TABLE (
  id UUID,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario actual es admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('admin', 'administrador')
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para acceder a esta información';
  END IF;

  -- Retornar los emails de usuarios
  RETURN QUERY
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  WHERE au.email IS NOT NULL;
END;
$$;

-- Función para obtener el email de un usuario específico
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Verificar que el usuario actual es admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('admin', 'administrador')
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para acceder a esta información';
  END IF;

  -- Obtener el email del usuario
  SELECT au.email INTO user_email
  FROM auth.users au
  WHERE au.id = user_id;

  RETURN COALESCE(user_email, 'No disponible');
END;
$$;

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_user_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;

-- Verificar que las funciones se crearon correctamente
SELECT 
  'get_user_emails' as function_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_user_emails'
  ) THEN 'Creada correctamente' ELSE 'Error al crear' END as status
UNION ALL
SELECT 
  'get_user_email' as function_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_user_email'
  ) THEN 'Creada correctamente' ELSE 'Error al crear' END as status;
