-- Diagnosticar push notifications completamente
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar suscripciones activas
SELECT 
  id,
  user_id,
  endpoint,
  p256dh,
  auth,
  is_active,
  created_at
FROM user_push_subscriptions 
WHERE is_active = true;

-- 2. Verificar notificaciones pendientes
SELECT 
  id,
  user_id,
  title,
  data->'needsPushNotification' as needs_push
FROM notification_history 
WHERE data->'needsPushNotification' = 'true'
ORDER BY created_at DESC;

-- 3. Verificar tu usuario
SELECT 
  id,
  email,
  full_name
FROM profiles 
WHERE email = 'viciana84@gmail.com';

-- 4. Verificar VAPID keys en la base de datos
SELECT 
  current_setting('app.vapid_public_key', true) as vapid_public_key,
  current_setting('app.vapid_private_key', true) as vapid_private_key; 