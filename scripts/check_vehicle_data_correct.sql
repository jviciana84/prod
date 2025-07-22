-- Script para verificar datos de vehículos en las tablas correctas
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de la tabla sales_vehicles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estructura de la tabla entregas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'entregas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar si hay datos de clientes en sales_vehicles
SELECT 
    COUNT(*) as total_vehiculos,
    COUNT(client_name) as con_nombre,
    COUNT(client_address) as con_direccion,
    COUNT(client_postal_code) as con_cp,
    COUNT(client_city) as con_ciudad,
    COUNT(client_province) as con_provincia,
    COUNT(client_phone) as con_telefono,
    COUNT(client_email) as con_email
FROM sales_vehicles;

-- 4. Verificar si hay datos de clientes en entregas
SELECT 
    COUNT(*) as total_entregas,
    COUNT(client_name) as con_nombre,
    COUNT(client_address) as con_direccion,
    COUNT(client_postal_code) as con_cp,
    COUNT(client_city) as con_ciudad,
    COUNT(client_province) as con_provincia,
    COUNT(client_phone) as con_telefono,
    COUNT(client_email) as con_email
FROM entregas;

-- 5. Mostrar algunos ejemplos de sales_vehicles con datos completos
SELECT 
    license_plate as matricula,
    client_name,
    client_address,
    client_postal_code,
    client_city,
    client_province,
    client_phone,
    client_email
FROM sales_vehicles 
WHERE client_name IS NOT NULL 
AND client_address IS NOT NULL
LIMIT 5;

-- 6. Mostrar algunos ejemplos de entregas con datos completos
SELECT 
    matricula,
    client_name,
    client_address,
    client_postal_code,
    client_city,
    client_province,
    client_phone,
    client_email
FROM entregas 
WHERE client_name IS NOT NULL 
AND client_address IS NOT NULL
LIMIT 5;

-- 7. Buscar una matrícula específica en sales_vehicles (cambiar '9532LMN' por la que quieras probar)
SELECT 
    license_plate as matricula,
    client_name,
    client_address,
    client_postal_code,
    client_city,
    client_province,
    client_phone,
    client_email,
    created_at
FROM sales_vehicles 
WHERE license_plate ILIKE '%9532LMN%'
ORDER BY created_at DESC;

-- 8. Buscar una matrícula específica en entregas (cambiar '9532LMN' por la que quieras probar)
SELECT 
    matricula,
    client_name,
    client_address,
    client_postal_code,
    client_city,
    client_province,
    client_phone,
    client_email,
    created_at
FROM entregas 
WHERE matricula ILIKE '%9532LMN%'
ORDER BY created_at DESC; 