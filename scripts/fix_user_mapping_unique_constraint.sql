-- Paso 1: Identificar y eliminar duplicados en user_asesor_mapping
-- Esto es crucial antes de añadir una restricción UNIQUE
DELETE FROM public.user_asesor_mapping a
USING public.user_asesor_mapping b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.asesor_alias = b.asesor_alias;

-- Paso 2: Añadir la restricción UNIQUE si no existe
DO $$
BEGIN
    -- Verificar si ya existe la restricción
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'user_asesor_mapping'
        AND constraint_name = 'user_asesor_mapping_user_id_asesor_alias_key' -- Nombre por defecto de Supabase/Postgres para UNIQUE (col1, col2)
    ) THEN
        -- Si no existe, intentar añadir la restricción única
        ALTER TABLE public.user_asesor_mapping
        ADD CONSTRAINT user_asesor_mapping_user_id_asesor_alias_key UNIQUE (user_id, asesor_alias);

        RAISE NOTICE 'Restricción única (user_id, asesor_alias) agregada exitosamente.';
    ELSE
        RAISE NOTICE 'La restricción única (user_id, asesor_alias) ya existe.';
    END IF;
END $$;

-- Paso 3: Verificar que la restricción se agregó correctamente
SELECT 'RESTRICCIONES DESPUÉS DEL FIX:' as info;

SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_asesor_mapping'
  AND kcu.column_name IN ('user_id', 'asesor_alias')
ORDER BY tc.constraint_name, kcu.ordinal_position;
