-- Solo agregar las foreign keys que faltan hacia profiles/auth.users
-- Esto es 100% seguro y no afecta datos existentes

-- Verificar si las foreign keys ya existen
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('document_movements', 'key_movements')
    AND kcu.column_name IN ('from_user_id', 'to_user_id');

-- Agregar foreign keys hacia auth.users (profiles) si no existen
DO $$
BEGIN
    -- Foreign keys para document_movements
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'document_movements_from_user_id_fkey'
    ) THEN
        ALTER TABLE document_movements 
        ADD CONSTRAINT document_movements_from_user_id_fkey 
        FOREIGN KEY (from_user_id) REFERENCES auth.users(id);
        
        RAISE NOTICE 'Agregada FK: document_movements.from_user_id -> auth.users.id';
    ELSE
        RAISE NOTICE 'FK ya existe: document_movements.from_user_id -> auth.users.id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'document_movements_to_user_id_fkey'
    ) THEN
        ALTER TABLE document_movements 
        ADD CONSTRAINT document_movements_to_user_id_fkey 
        FOREIGN KEY (to_user_id) REFERENCES auth.users(id);
        
        RAISE NOTICE 'Agregada FK: document_movements.to_user_id -> auth.users.id';
    ELSE
        RAISE NOTICE 'FK ya existe: document_movements.to_user_id -> auth.users.id';
    END IF;

    -- Foreign keys para key_movements
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'key_movements_from_user_id_fkey'
    ) THEN
        ALTER TABLE key_movements 
        ADD CONSTRAINT key_movements_from_user_id_fkey 
        FOREIGN KEY (from_user_id) REFERENCES auth.users(id);
        
        RAISE NOTICE 'Agregada FK: key_movements.from_user_id -> auth.users.id';
    ELSE
        RAISE NOTICE 'FK ya existe: key_movements.from_user_id -> auth.users.id';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'key_movements_to_user_id_fkey'
    ) THEN
        ALTER TABLE key_movements 
        ADD CONSTRAINT key_movements_to_user_id_fkey 
        FOREIGN KEY (to_user_id) REFERENCES auth.users(id);
        
        RAISE NOTICE 'Agregada FK: key_movements.to_user_id -> auth.users.id';
    ELSE
        RAISE NOTICE 'FK ya existe: key_movements.to_user_id -> auth.users.id';
    END IF;

END $$;

-- Verificar que las foreign keys se agregaron correctamente
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('document_movements', 'key_movements')
ORDER BY tc.table_name, kcu.column_name;
