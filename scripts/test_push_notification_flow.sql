-- Probar flujo completo de push notifications
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que tienes suscripciones activas
SELECT 
  user_id,
  endpoint,
  is_active,
  created_at
FROM user_push_subscriptions 
WHERE is_active = true;

-- 2. Crear una notificación de prueba para tu usuario
INSERT INTO notification_history (
  user_id,
  title,
  body,
  data,
  created_at
) VALUES (
  'd8949618-e8a3-4e45-a373-1ad51532534e', -- Tu user_id
  '📷 Nuevas fotografías asignadas',
  'Se te han asignado nuevas fotografías para tomar: TEST123 BMW X1',
  jsonb_build_object(
    'type', 'photo_assignment',
    'vehicleId', 'test-vehicle-id',
    'licensePlate', 'TEST123',
    'model', 'BMW X1',
    'url', '/dashboard/photos',
    'needsPushNotification', true
  ),
  NOW()
);

-- 3. Verificar que se creó la notificación
SELECT 
  id,
  user_id,
  title,
  data->'needsPushNotification' as needs_push
FROM notification_history 
WHERE data->'needsPushNotification' = 'true'
ORDER BY created_at DESC 
LIMIT 1; 