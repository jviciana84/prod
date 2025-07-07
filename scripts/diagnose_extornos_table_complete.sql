-- Script para diagnosticar completamente la tabla extornos
-- Ejecuta este script y pega el resultado completo

-- 1. Estructura de la tabla extornos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'extornos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Constraints de la tabla extornos
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.extornos'::regclass;

-- 3. Verificar específicamente el check constraint del estado
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.extornos'::regclass 
AND conname LIKE '%estado%';

-- 4. Ver algunos registros de ejemplo para entender los estados actuales
SELECT 
    id,
    matricula,
    estado,
    created_at
FROM extornos 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Ver todos los estados únicos que existen actualmente
SELECT DISTINCT estado, COUNT(*) as cantidad
FROM extornos 
GROUP BY estado
ORDER BY cantidad DESC;

-- 6. Información sobre triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'extornos';

-- 7. Verificar si existe la columna pago_confirmado_at
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'extornos' 
AND column_name = 'pago_confirmado_at';
