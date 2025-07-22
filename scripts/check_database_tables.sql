-- Script para verificar qué tablas existen en la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Listar todas las tablas del esquema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Buscar tablas que contengan 'vehiculo' en el nombre
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%vehiculo%'
ORDER BY table_name;

-- 3. Buscar tablas que contengan 'matricula' en el nombre
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%matricula%'
ORDER BY table_name;

-- 4. Buscar tablas que contengan 'client' en el nombre
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%client%'
ORDER BY table_name;

-- 5. Verificar si existe la tabla 'nuevas_entradas'
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name = 'nuevas_entradas';

-- 6. Si existe 'nuevas_entradas', verificar su estructura
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar si existe la tabla 'entregas_en_mano'
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name = 'entregas_en_mano';

-- 8. Si existe 'entregas_en_mano', verificar su estructura
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'entregas_en_mano' 
AND table_schema = 'public'
ORDER BY ordinal_position; 