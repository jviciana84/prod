-- Diagnosticar la función confirm_extorno_payment actual
-- Ver el código SQL completo de la función

SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'confirm_extorno_payment'
AND n.nspname = 'public';

-- También verificar la estructura de la tabla extornos
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'extornos'
AND table_schema = 'public'
AND column_name IN ('id', 'confirmation_token', 'estado', 'pago_confirmado_at')
ORDER BY ordinal_position;

-- Ver si hay algún índice en confirmation_token
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'extornos'
AND indexdef LIKE '%confirmation_token%';
