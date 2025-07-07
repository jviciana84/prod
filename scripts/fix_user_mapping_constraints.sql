-- Verificar estructura actual de la tabla
SELECT 'ESTRUCTURA ACTUAL DE user_asesor_mapping:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_asesor_mapping' 
ORDER BY ordinal_position;

-- Ver restricciones existentes
SELECT 'RESTRICCIONES EXISTENTES:' as info;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_asesor_mapping';

-- Agregar restricción única si no existe
DO $$
BEGIN
    -- Verificar si ya existe la restricción
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_asesor_mapping' 
        AND constraint_name = 'user_asesor_mapping_unique'
    ) THEN
        -- Agregar restricción única
        ALTER TABLE user_asesor_mapping 
        ADD CONSTRAINT user_asesor_mapping_unique 
        UNIQUE (user_id, asesor_alias);
        
        RAISE NOTICE 'Restricción única agregada exitosamente';
    ELSE
        RAISE NOTICE 'La restricción única ya existe';
    END IF;
END $$;

-- Verificar que se agregó correctamente
SELECT 'RESTRICCIONES DESPUÉS DEL FIX:' as info;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_asesor_mapping';
