-- =====================================================
-- AÑADIR COLUMNAS SIMPLE - SIN ERRORES
-- =====================================================

-- Añadir las columnas una por una con manejo de errores
DO $$
BEGIN
    -- Añadir Días stock
    BEGIN
        ALTER TABLE public.duc_scraper ADD COLUMN "Días stock" TEXT;
        RAISE NOTICE 'Columna "Días stock" añadida correctamente';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Columna "Días stock" ya existe';
    END;
    
    -- Añadir Matrícula
    BEGIN
        ALTER TABLE public.duc_scraper ADD COLUMN "Matrícula" TEXT;
        RAISE NOTICE 'Columna "Matrícula" añadida correctamente';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Columna "Matrícula" ya existe';
    END;
    
    -- Añadir Modelo
    BEGIN
        ALTER TABLE public.duc_scraper ADD COLUMN "Modelo" TEXT;
        RAISE NOTICE 'Columna "Modelo" añadida correctamente';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Columna "Modelo" ya existe';
    END;
END $$;

-- Verificar el total final
SELECT 
    'TOTAL FINAL' as tipo,
    COUNT(*) as columnas
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public';

-- Verificar las 3 columnas clave
SELECT 
    'COLUMNAS CLAVE' as tipo,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'
AND column_name IN ('Días stock', 'Matrícula', 'Modelo')
ORDER BY column_name;
