-- Arreglar suscripciones con user_id corruptos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar suscripciones corruptas
SELECT 
  id,
  user_id,
  endpoint,
  is_active,
  created_at
FROM user_push_subscriptions 
WHERE user_id IS NULL 
   OR user_id = '00000000-0000-0000-0000-000000000000';

-- 2. Eliminar suscripciones corruptas
DELETE FROM user_push_subscriptions 
WHERE user_id IS NULL 
   OR user_id = '00000000-0000-0000-0000-000000000000';

-- 3. Verificar suscripciones válidas
SELECT 
  id,
  user_id,
  endpoint,
  is_active,
  created_at
FROM user_push_subscriptions 
WHERE is_active = true
ORDER BY created_at DESC;

-- 4. Contar suscripciones válidas
SELECT 
  COUNT(*) as suscripciones_validas
FROM user_push_subscriptions 
WHERE is_active = true 
  AND user_id IS NOT NULL 
  AND user_id != '00000000-0000-0000-0000-000000000000'; 