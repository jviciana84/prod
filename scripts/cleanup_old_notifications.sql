-- Limpiar notificaciones antiguas sin suscripciones activas
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar notificaciones pendientes
SELECT 
  id,
  user_id,
  title,
  created_at
FROM notification_history 
WHERE data->'needsPushNotification' = 'true'
ORDER BY created_at DESC;

-- 2. Verificar suscripciones activas
SELECT 
  user_id,
  COUNT(*) as suscripciones_activas
FROM user_push_subscriptions 
WHERE is_active = true
GROUP BY user_id;

-- 3. Eliminar notificaciones pendientes de usuarios sin suscripciones activas
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