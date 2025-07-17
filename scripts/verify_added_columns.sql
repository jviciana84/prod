-- =====================================================
-- VERIFICAR SI LAS COLUMNAS SE AÑADIERON CORRECTAMENTE
-- =====================================================

-- Verificar si las 3 columnas están presentes
SELECT 
    'VERIFICACIÓN COLUMNAS AÑADIDAS' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'
AND column_name IN ('Días stock', 'Matrícula', 'Modelo')
ORDER BY column_name;

-- Si no están, las añadimos de nuevo
DO $$
BEGIN
    -- Añadir Días stock si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'duc_scraper' 
        AND column_name = 'Días stock'
    ) THEN
        ALTER TABLE public.duc_scraper ADD COLUMN "Días stock" TEXT;
        RAISE NOTICE 'Columna "Días stock" añadida';
    END IF;
    
    -- Añadir Matrícula si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'duc_scraper' 
        AND column_name = 'Matrícula'
    ) THEN
        ALTER TABLE public.duc_scraper ADD COLUMN "Matrícula" TEXT;
        RAISE NOTICE 'Columna "Matrícula" añadida';
    END IF;
    
    -- Añadir Modelo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'duc_scraper' 
        AND column_name = 'Modelo'
    ) THEN
        ALTER TABLE public.duc_scraper ADD COLUMN "Modelo" TEXT;
        RAISE NOTICE 'Columna "Modelo" añadida';
    END IF;
END $$;

-- Verificar de nuevo después de la ejecución
SELECT 
    'VERIFICACIÓN FINAL' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'
AND column_name IN ('Días stock', 'Matrícula', 'Modelo')
ORDER BY column_name;

-- Conteo total
SELECT 
    'TOTAL COLUMNAS' as tipo,
    COUNT(*) as cantidad
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'; 