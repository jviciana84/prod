-- Verificar estado del trigger de notificaciones
-- Ejecutar en Supabase SQL Editor

-- Verificar si existe la función
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'send_photo_assignment_notification';

-- Verificar si existen los triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%photo_assignment%';

-- Verificar notificaciones recientes
SELECT 
  id,
  user_id,
  title,
  body,
  data,
  created_at
FROM notification_history 
WHERE title LIKE '%fotografías%'
ORDER BY created_at DESC 
LIMIT 5; 