-- Arreglar tabla user_push_subscriptions
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura actual
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_push_subscriptions'
ORDER BY ordinal_position;

-- 2. Crear tabla temporal con estructura correcta
CREATE TABLE IF NOT EXISTS user_push_subscriptions_fixed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Copiar datos existentes (si hay)
INSERT INTO user_push_subscriptions_fixed (user_id, subscription_data, is_active, created_at, updated_at)
SELECT 
  user_id,
  '{"endpoint": "placeholder", "keys": {"p256dh": "placeholder", "auth": "placeholder"}}'::jsonb as subscription_data,
  is_active,
  created_at,
  updated_at
FROM user_push_subscriptions;

-- 4. Eliminar tabla antigua
DROP TABLE IF EXISTS user_push_subscriptions;

-- 5. Renombrar tabla nueva
ALTER TABLE user_push_subscriptions_fixed RENAME TO user_push_subscriptions;

-- 6. Crear índices
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id ON user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_active ON user_push_subscriptions(is_active);

-- 7. Verificar resultado
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_push_subscriptions'
ORDER BY ordinal_position; 