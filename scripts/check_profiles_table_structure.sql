-- Verificar estructura de la tabla profiles
SELECT 'Estructura de la tabla profiles:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar algunos datos de ejemplo
SELECT 'Datos de ejemplo de profiles:' as info;
SELECT id, email, full_name, position, created_at
FROM profiles 
LIMIT 5;

-- Verificar si existe alguna columna relacionada con roles
SELECT 'Columnas que podrían contener roles:' as info;
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND (column_name ILIKE '%role%' OR column_name ILIKE '%permission%' OR column_name ILIKE '%admin%');
