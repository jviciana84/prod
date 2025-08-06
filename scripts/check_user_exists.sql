-- Verificar si el usuario existe en profiles
SELECT 
    id,
    email,
    full_name,
    created_at
FROM profiles 
WHERE email = 'jordi.viciana@munichgroup.es';

-- Ver todos los usuarios en profiles
SELECT 
    id,
    email,
    full_name,
    created_at
FROM profiles 
ORDER BY created_at DESC; 