-- Script simple para verificar y corregir el alias de Jordi Viciana
-- Ejecuta este script en tu base de datos Supabase

-- 1. Ver el estado actual
SELECT 'Estado actual de Jordi:' as info;
SELECT id, full_name, alias, email FROM profiles 
WHERE full_name ILIKE '%jordi%' OR email = 'jordi.viciana@munichgroup.es';

-- 2. Actualizar el alias a 'jordivi' (como aparece en los emails)
UPDATE profiles
SET alias = 'jordivi'
WHERE full_name ILIKE '%jordi%viciana%' OR email = 'jordi.viciana@munichgroup.es';

-- 3. Verificar el resultado
SELECT 'Después de la actualización:' as info;
SELECT id, full_name, alias, email FROM profiles 
WHERE full_name ILIKE '%jordi%' OR email = 'jordi.viciana@munichgroup.es';

-- 4. Verificar que el alias 'jordivi' existe
SELECT 'Verificando alias jordivi:' as info;
SELECT id, full_name, alias, email FROM profiles 
WHERE LOWER(alias) = 'jordivi'; 