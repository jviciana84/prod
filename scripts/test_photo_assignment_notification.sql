-- Script para probar las notificaciones de asignación de fotógrafos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que el trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%photo_assignment%';

-- 2. Insertar una notificación de prueba para JordiVi
DO $$
DECLARE
  jordi_user_id UUID;
BEGIN
  -- Obtener el ID de JordiVi (jordi.viciana84@gmail.com)
  SELECT id INTO jordi_user_id 
  FROM auth.users 
  WHERE email = 'jordi.viciana84@gmail.com';
  
  IF jordi_user_id IS NOT NULL THEN
    -- Insertar notificación de prueba
    INSERT INTO notification_history (
      user_id,
      title,
      body,
      data,
      created_at
    ) VALUES (
      jordi_user_id,
      '📷 Nuevas fotografías asignadas',
      'Se te han asignado nuevas fotografías para tomar: ABC1234 BMW X5',
      jsonb_build_object(
        'type', 'photo_assignment',
        'vehicleId', 'test-vehicle-123',
        'licensePlate', 'ABC1234',
        'model', 'BMW X5',
        'url', '/dashboard/photos'
      ),
      NOW()
    );
    
    RAISE NOTICE 'Notificación de prueba creada para JordiVi (ID: %)', jordi_user_id;
  ELSE
    RAISE NOTICE 'Usuario JordiVi no encontrado';
  END IF;
END $$;

-- 3. Verificar las notificaciones creadas
SELECT 
  nh.id,
  nh.title,
  nh.body,
  nh.created_at,
  p.full_name,
  p.email
FROM notification_history nh
JOIN profiles p ON nh.user_id = p.id
WHERE nh.title LIKE '%fotografías%'
ORDER BY nh.created_at DESC
LIMIT 10;

-- 4. Verificar suscripciones push del usuario
SELECT 
  ups.user_id,
  ups.is_active,
  ups.created_at,
  p.full_name,
  p.email
FROM user_push_subscriptions ups
JOIN profiles p ON ups.user_id = p.id
WHERE p.email = 'jordi.viciana84@gmail.com'; 