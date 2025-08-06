-- Verificar suscripciones de jordi.viciana
-- Ejecutar en Supabase SQL Editor

-- 1. Buscar usuario jordi.viciana
SELECT 
  id,
  email,
  full_name
FROM profiles 
WHERE email LIKE '%jordi%' OR email LIKE '%viciana%';

-- 2. Verificar todas las suscripciones activas
SELECT 
  id,
  user_id,
  endpoint,
  is_active,
  created_at
FROM user_push_subscriptions 
WHERE is_active = true
ORDER BY created_at DESC;

-- 3. Verificar si jordi tiene suscripciones
SELECT 
  p.email,
  p.full_name,
  COUNT(ups.id) as suscripciones_activas
FROM profiles p
LEFT JOIN user_push_subscriptions ups ON p.id = ups.user_id AND ups.is_active = true
WHERE p.email LIKE '%jordi%' OR p.email LIKE '%viciana%'
GROUP BY p.id, p.email, p.full_name; 