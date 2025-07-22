-- Script para verificar datos de clientes en sales_vehicles
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si hay datos de clientes en sales_vehicles
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

-- 2. Mostrar algunos ejemplos de vehículos con datos completos del cliente
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

-- 3. Mostrar algunos ejemplos de vehículos sin datos del cliente
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
WHERE client_name IS NULL 
OR client_address IS NULL
LIMIT 5;

-- 4. Buscar una matrícula específica (cambiar '9532LMN' por la que quieras probar)
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