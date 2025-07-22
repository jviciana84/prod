-- Script para verificar datos de vehículos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura de la tabla vehiculos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vehiculos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si hay datos de clientes en la tabla
SELECT 
    COUNT(*) as total_vehiculos,
    COUNT(client_name) as con_nombre,
    COUNT(client_address) as con_direccion,
    COUNT(client_postal_code) as con_cp,
    COUNT(client_city) as con_ciudad,
    COUNT(client_province) as con_provincia,
    COUNT(client_phone) as con_telefono,
    COUNT(client_email) as con_email
FROM vehiculos;

-- 3. Mostrar algunos ejemplos de vehículos con datos completos
SELECT 
    matricula,
    client_name,
    client_address,
    client_postal_code,
    client_city,
    client_province,
    client_phone,
    client_email
FROM vehiculos 
WHERE client_name IS NOT NULL 
AND client_address IS NOT NULL
LIMIT 5;

-- 4. Mostrar algunos ejemplos de vehículos sin datos de cliente
SELECT 
    matricula,
    client_name,
    client_address,
    client_postal_code,
    client_city,
    client_province,
    client_phone,
    client_email
FROM vehiculos 
WHERE client_name IS NULL 
OR client_address IS NULL
LIMIT 5;

-- 5. Buscar una matrícula específica (cambiar '9532LMN' por la que quieras probar)
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
FROM vehiculos 
WHERE matricula ILIKE '%9532LMN%'
ORDER BY created_at DESC; 