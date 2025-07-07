-- Solución: Añadir "pagado" a los estados permitidos

-- Opción 1: Si es un CHECK constraint simple
ALTER TABLE public.extornos DROP CONSTRAINT IF EXISTS extornos_estado_check;
ALTER TABLE public.extornos ADD CONSTRAINT extornos_estado_check 
CHECK (estado IN ('pendiente', 'tramitado', 'realizado', 'rechazado', 'pagado'));

-- Opción 2: Si es un tipo ENUM, añadir el valor
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'extorno_estado') THEN
        ALTER TYPE public.extorno_estado ADD VALUE 'pagado';
    END IF;
END $$;

-- Verificar que el constraint ahora permite "pagado"
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.extornos'::regclass 
AND conname LIKE '%estado%';

-- Verificar que se añadió correctamente
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'extorno_estado')
ORDER BY enumlabel;
