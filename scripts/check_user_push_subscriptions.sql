-- Verificar suscripciones push del usuario
-- Ejecutar en Supabase SQL Editor

-- Buscar el user_id del usuario
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Buscar el usuario por email
  SELECT id INTO current_user_id
  FROM auth.users 
  WHERE email = 'viciana84@gmail.com';
  
  RAISE NOTICE 'User ID encontrado: %', current_user_id;
  
  -- Verificar suscripciones push
  IF current_user_id IS NOT NULL THEN
    RAISE NOTICE 'Suscripciones push para %:', current_user_id;
    
    -- Mostrar todas las suscripciones
    PERFORM 
      id,
      user_id,
      is_active,
      created_at
    FROM user_push_subscriptions 
    WHERE user_id = current_user_id;
    
    -- Contar suscripciones activas
    RAISE NOTICE 'Suscripciones activas: %', (
      SELECT COUNT(*) 
      FROM user_push_subscriptions 
      WHERE user_id = current_user_id AND is_active = true
    );
  ELSE
    RAISE NOTICE 'Usuario no encontrado';
  END IF;
END $$; 