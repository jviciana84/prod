-- Verificar el alias actual de Jordi Viciana
SELECT 'ALIAS ACTUAL DE JORDI:' as info;
SELECT 
    id,
    full_name,
    alias,
    email
FROM profiles 
WHERE full_name ILIKE '%jordi%' OR email = 'jordi.viciana@munichgroup.es';

-- Verificar si existe el alias 'jordivi' en minúsculas
SELECT 'BUSCANDO ALIAS jordivi:' as info;
SELECT 
    id,
    full_name,
    alias,
    email
FROM profiles 
WHERE LOWER(alias) = 'jordivi';

-- Actualizar el alias de Jordi a 'jordivi' (en minúsculas como aparece en los emails)
UPDATE profiles
SET alias = 'jordivi'
WHERE full_name ILIKE '%jordi%viciana%' OR email = 'jordi.viciana@munichgroup.es';

-- Verificar el resultado
SELECT 'ALIAS ACTUALIZADO:' as info;
SELECT 
    id,
    full_name,
    alias,
    email
FROM profiles 
WHERE full_name ILIKE '%jordi%' OR email = 'jordi.viciana@munichgroup.es'; 