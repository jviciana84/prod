-- Script específico para ver el constraint del estado
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.extornos'::regclass 
AND conname LIKE '%estado%';

-- También ver qué estados existen actualmente
SELECT DISTINCT estado, COUNT(*) as cantidad
FROM extornos 
GROUP BY estado
ORDER BY cantidad DESC;

-- Ver la definición del tipo enum si existe
SELECT 
    t.typname,
    e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'extorno_estado'
ORDER BY e.enumsortorder;
