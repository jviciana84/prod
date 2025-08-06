-- Eliminar notificaciones huérfanas (sin suscripciones activas)
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar cuántas notificaciones se van a eliminar
SELECT 
  COUNT(*) as notificaciones_a_eliminar
FROM notification_history 
WHERE data->'needsPushNotification' = 'true'
AND user_id NOT IN (
  SELECT DISTINCT user_id 
  FROM user_push_subscriptions 
  WHERE is_active = true
);

-- 2. Verificar qué usuarios tienen notificaciones vs suscripciones
SELECT 
  nh.user_id,
  COUNT(nh.id) as notificaciones_pendientes,
  COUNT(ups.id) as suscripciones_activas
FROM notification_history nh
LEFT JOIN user_push_subscriptions ups ON nh.user_id = ups.user_id AND ups.is_active = true
WHERE nh.data->'needsPushNotification' = 'true'
GROUP BY nh.user_id;

-- 3. Eliminar notificaciones de usuarios sin suscripciones activas
DELETE FROM notification_history 
WHERE data->'needsPushNotification' = 'true'
AND user_id NOT IN (
  SELECT DISTINCT user_id 
  FROM user_push_subscriptions 
  WHERE is_active = true
);

-- 4. Verificar resultado
SELECT 
  COUNT(*) as notificaciones_restantes
FROM notification_history 
WHERE data->'needsPushNotification' = 'true'; 