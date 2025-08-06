-- Script para verificar la configuración de push notifications
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar suscripciones push activas
SELECT 
  ups.user_id,
  ups.is_active,
  ups.created_at,
  p.full_name,
  p.email,
  CASE 
    WHEN ups.is_active THEN '✅ Activa'
    ELSE '❌ Inactiva'
  END as status
FROM user_push_subscriptions ups
JOIN profiles p ON ups.user_id = p.id
ORDER BY ups.created_at DESC;

-- 2. Verificar notificaciones recientes
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

-- 3. Verificar usuarios con notificaciones
SELECT 
  p.full_name,
  p.email,
  COUNT(nh.id) as total_notifications,
  COUNT(CASE WHEN nh.read_at IS NULL THEN 1 END) as unread_notifications
FROM profiles p
LEFT JOIN notification_history nh ON p.id = nh.user_id
WHERE nh.title LIKE '%fotografías%'
GROUP BY p.id, p.full_name, p.email
ORDER BY total_notifications DESC;

-- 4. Verificar configuración de VAPID (solo información básica)
SELECT 
  'VAPID_PRIVATE_KEY' as config_key,
  CASE 
    WHEN current_setting('app.vapid_private_key', true) IS NOT NULL 
    THEN '✅ Configurado'
    ELSE '❌ No configurado'
  END as status; 