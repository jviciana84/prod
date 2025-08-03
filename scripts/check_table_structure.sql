-- Script para verificar la estructura de la tabla fotos_asignadas
-- Ejecutar en Supabase SQL Editor

-- Ver la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fotos_asignadas'
ORDER BY ordinal_position;

-- Ver las restricciones de la tabla
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'fotos_asignadas'; 