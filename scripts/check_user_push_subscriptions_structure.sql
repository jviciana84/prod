-- Verificar estructura de la tabla user_push_subscriptions
-- Ejecutar en Supabase SQL Editor

-- Mostrar estructura actual
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_push_subscriptions'
ORDER BY ordinal_position; 