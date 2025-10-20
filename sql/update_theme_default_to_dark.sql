-- Script para actualizar el tema por defecto de 'system' a 'dark' en usuarios existentes
-- Ejecutar este script en Supabase SQL Editor después del deploy

-- Actualizar usuarios con tema 'system' a 'dark'
UPDATE user_preferences
SET 
  theme = 'dark',
  updated_at = NOW()
WHERE theme = 'system';

-- Verificar el cambio
SELECT 
  theme, 
  COUNT(*) as usuarios
FROM user_preferences
GROUP BY theme
ORDER BY theme;

