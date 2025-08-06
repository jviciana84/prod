-- Eliminar notificaciones antiguas definitivamente
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar qué notificaciones se van a eliminar
SELECT 
  id,
  user_id,
  title,
  created_at
FROM notification_history 
WHERE data->'needsPushNotification' = 'true';

-- 2. Eliminar todas las notificaciones pendientes
DELETE FROM notification_history 
WHERE data->'needsPushNotification' = 'true';

-- 3. Verificar resultado
SELECT 
  COUNT(*) as notificaciones_restantes
FROM notification_history 
WHERE data->'needsPushNotification' = 'true'; 