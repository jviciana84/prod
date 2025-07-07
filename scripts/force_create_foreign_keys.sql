-- Crear foreign keys hacia auth.users de forma forzada
-- Primero eliminar cualquier constraint existente que pueda estar mal configurado

DO $$
BEGIN
    -- Eliminar constraints existentes si existen (para poder recrearlos correctamente)
    BEGIN
        ALTER TABLE document_movements DROP CONSTRAINT IF EXISTS document_movements_from_user_id_fkey;
        ALTER TABLE document_movements DROP CONSTRAINT IF EXISTS document_movements_to_user_id_fkey;
        ALTER TABLE key_movements DROP CONSTRAINT IF EXISTS key_movements_from_user_id_fkey;
        ALTER TABLE key_movements DROP CONSTRAINT IF EXISTS key_movements_to_user_id_fkey;
        RAISE NOTICE 'Constraints eliminados (si existían)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error eliminando constraints: %', SQLERRM;
    END;

    -- Crear foreign keys hacia auth.users
    BEGIN
        ALTER TABLE document_movements 
        ADD CONSTRAINT document_movements_from_user_id_fkey 
        FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'FK creada: document_movements.from_user_id -> auth.users.id';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creando FK document_movements.from_user_id: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE document_movements 
        ADD CONSTRAINT document_movements_to_user_id_fkey 
        FOREIGN KEY (to_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK creada: document_movements.to_user_id -> auth.users.id';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creando FK document_movements.to_user_id: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE key_movements 
        ADD CONSTRAINT key_movements_from_user_id_fkey 
        FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'FK creada: key_movements.from_user_id -> auth.users.id';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creando FK key_movements.from_user_id: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE key_movements 
        ADD CONSTRAINT key_movements_to_user_id_fkey 
        FOREIGN KEY (to_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'FK creada: key_movements.to_user_id -> auth.users.id';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creando FK key_movements.to_user_id: %', SQLERRM;
    END;

END $$;

-- Verificar que las foreign keys se crearon correctamente
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('document_movements', 'key_movements')
    AND kcu.column_name IN ('from_user_id', 'to_user_id')
ORDER BY tc.table_name, kcu.column_name;
