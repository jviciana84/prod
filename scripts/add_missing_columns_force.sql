-- =====================================================
-- AÑADIR COLUMNAS FALTANTES - FORZADO
-- =====================================================
-- Descripción: Añadir las 3 columnas que faltan: Días stock, Matrícula, Modelo
-- =====================================================

-- Añadir las 3 columnas faltantes (sin IF NOT EXISTS para forzar)
ALTER TABLE public.duc_scraper ADD COLUMN "Días stock" TEXT;
ALTER TABLE public.duc_scraper ADD COLUMN "Matrícula" TEXT;
ALTER TABLE public.duc_scraper ADD COLUMN "Modelo" TEXT;

-- Crear índices para las nuevas columnas importantes
CREATE INDEX IF NOT EXISTS idx_duc_scraper_matricula ON public.duc_scraper("Matrícula");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_modelo ON public.duc_scraper("Modelo");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_dias_stock ON public.duc_scraper("Días stock");

-- Verificar que las columnas se han añadido correctamente
SELECT 
    'COLUMNAS AÑADIDAS' as estado,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'
AND column_name IN ('Días stock', 'Matrícula', 'Modelo')
ORDER BY column_name;

-- Mostrar el total de columnas después de la actualización
SELECT 
    'TOTAL COLUMNAS DESPUÉS' as tipo,
    COUNT(*) as cantidad
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public';

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN public.duc_scraper."Días stock" IS 'Días que lleva el vehículo en stock';
COMMENT ON COLUMN public.duc_scraper."Matrícula" IS 'Matrícula del vehículo - Campo clave para mapeo';
COMMENT ON COLUMN public.duc_scraper."Modelo" IS 'Modelo del vehículo - Campo clave para mapeo';

-- Verificar que ahora tenemos las 95 columnas del Excel + 6 metadatos = 101 total
SELECT 
    'VERIFICACIÓN FINAL' as tipo,
    CASE 
        WHEN COUNT(*) = 101 THEN '✅ TABLA COMPLETA - 95 columnas Excel + 6 metadatos'
        ELSE '❌ TABLA INCOMPLETA - Faltan columnas'
    END as estado,
    COUNT(*) as total_columnas
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'; 