-- Script para verificar que las tablas existen
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar que las tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('nuevas_entradas', 'stock')
ORDER BY table_name;

-- 2. Ver estructura básica de nuevas_entradas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'nuevas_entradas'
ORDER BY ordinal_position;

-- 3. Ver estructura básica de stock
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'stock'
ORDER BY ordinal_position;

-- 4. Verificar si la función get_table_structure existe
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_table_structure'; 