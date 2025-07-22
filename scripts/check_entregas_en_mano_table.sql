-- Verificar si existe la tabla entregas_en_mano
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'entregas_en_mano';

-- Si existe, mostrar su estructura
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano'
    ) THEN
        RAISE NOTICE 'La tabla entregas_en_mano existe';
        
        -- Mostrar estructura
        RAISE NOTICE 'Estructura de la tabla:';
        FOR r IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'entregas_en_mano'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  %: % (nullable: %, default: %)', 
                r.column_name, r.data_type, r.is_nullable, r.column_default;
        END LOOP;
        
    ELSE
        RAISE NOTICE 'La tabla entregas_en_mano NO existe';
    END IF;
END $$; 