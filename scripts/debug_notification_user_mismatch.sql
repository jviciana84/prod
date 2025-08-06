-- Diagnosticar problema de usuarios en notificaciones vs suscripciones
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar notificaciones pendientes con detalles
SELECT 
  id,
  user_id,
  title,
  created_at,
  data->'needsPushNotification' as needs_push
FROM notification_history 
WHERE data->'needsPushNotification' = 'true'
ORDER BY created_at DESC;

-- 2. Verificar TODAS las suscripciones (activas e inactivas)
SELECT 
  user_id,
  is_active,
  COUNT(*) as count
FROM user_push_subscriptions 
GROUP BY user_id, is_active
ORDER BY user_id, is_active;

-- 3. Verificar usuarios específicos de las notificaciones
SELECT 
  '448247e2-6045-4aff-b4c8-18b796dd12cc' as notification_user_id,
  COUNT(*) as suscripciones_activas
FROM user_push_subscriptions 
WHERE user_id = '448247e2-6045-4aff-b4c8-18b796dd12cc' 
AND is_active = true;

SELECT 
  '7eea2d82-3121-4c4e-a0b0-e3db9c0ccf14' as notification_user_id,
  COUNT(*) as suscripciones_activas
FROM user_push_subscriptions 
WHERE user_id = '7eea2d82-3121-4c4e-a0b0-e3db9c0ccf14' 
AND is_active = true;

-- 4. Verificar si estos usuarios existen en profiles
SELECT 
  id,
  email,
  full_name
FROM profiles 
WHERE id IN ('448247e2-6045-4aff-b4c8-18b796dd12cc', '7eea2d82-3121-4c4e-a0b0-e3db9c0ccf14');

-- 5. Verificar tu usuario actual
SELECT 
  'd8949618-e8a3-4e45-a373-1ad51532534e' as tu_user_id,
  COUNT(*) as tus_suscripciones_activas
FROM user_push_subscriptions 
WHERE user_id = 'd8949618-e8a3-4e45-a373-1ad51532534e' 
AND is_active = true; 