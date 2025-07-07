-- Diagnóstico completo para el usuario "Jordi Viciana"

-- 1. Verificar el perfil de Jordi en la tabla 'profiles'
-- Esto nos mostrará su 'full_name', 'alias', 'email' y 'position'
SELECT 
    id, 
    email, 
    full_name, 
    alias, 
    position, 
    created_at, 
    updated_at
FROM 
    public.profiles
WHERE 
    email = 'jordi.viciana@munichgroup.es' OR full_name ILIKE '%Jordi Viciana%';

-- 2. Verificar los mapeos existentes para Jordi en 'user_asesor_mapping'
-- Esto nos mostrará qué 'asesor_alias' y 'profile_name' están actualmente asociados a su usuario
SELECT 
    id, 
    user_id, 
    profile_name, 
    asesor_alias, 
    email, 
    active, 
    created_at, 
    updated_at
FROM 
    public.user_asesor_mapping
WHERE 
    email = 'jordi.viciana@munichgroup.es' OR profile_name ILIKE '%Jordi Viciana%';

-- 3. Verificar los valores de 'asesor' en la tabla 'entregas' para Jordi
-- Esto nos mostrará cómo aparece su nombre en los registros de entregas
SELECT DISTINCT 
    asesor, 
    COUNT(*) as count_entregas
FROM 
    public.entregas
WHERE 
    asesor ILIKE '%Jordi%'
GROUP BY 
    asesor
ORDER BY 
    count_entregas DESC;

-- 4. Verificar los valores de 'asesor' en la tabla 'sales_vehicles' para Jordi
-- Esto nos mostrará cómo aparece su nombre en los registros de ventas de vehículos
SELECT DISTINCT 
    asesor, 
    COUNT(*) as count_sales_vehicles
FROM 
    public.sales_vehicles
WHERE 
    asesor ILIKE '%Jordi%'
GROUP BY 
    asesor
ORDER BY 
    count_sales_vehicles DESC;

-- 5. Verificar los valores de 'asesor' en la tabla 'stock' para Jordi
-- Esto nos mostrará cómo aparece su nombre en los registros de stock
SELECT DISTINCT 
    asesor, 
    COUNT(*) as count_stock
FROM 
    public.stock
WHERE 
    asesor ILIKE '%Jordi%'
GROUP BY 
    asesor
ORDER BY 
    count_stock DESC;
