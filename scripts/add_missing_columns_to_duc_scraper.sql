-- =====================================================
-- AÑADIR COLUMNAS FALTANTES A DUC_SCRAPER
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Añadir las columnas que faltan en duc_scraper según el Excel real
-- =====================================================

-- Añadir las columnas faltantes
ALTER TABLE public.duc_scraper 
ADD COLUMN IF NOT EXISTS "Días stock" TEXT,
ADD COLUMN IF NOT EXISTS "Matrícula" TEXT,
ADD COLUMN IF NOT EXISTS "Modelo" TEXT;

-- Crear índices para las nuevas columnas importantes
CREATE INDEX IF NOT EXISTS idx_duc_scraper_matricula ON public.duc_scraper("Matrícula");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_modelo ON public.duc_scraper("Modelo");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_dias_stock ON public.duc_scraper("Días stock");

-- Verificar que las columnas se han añadido correctamente
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND column_name IN ('Días stock', 'Matrícula', 'Modelo')
ORDER BY column_name;

-- Mostrar el total de columnas en la tabla
SELECT 
    COUNT(*) as total_columnas
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public';

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN public.duc_scraper."Días stock" IS 'Días que lleva el vehículo en stock';
COMMENT ON COLUMN public.duc_scraper."Matrícula" IS 'Matrícula del vehículo';
COMMENT ON COLUMN public.duc_scraper."Modelo" IS 'Modelo del vehículo';

-- Verificar la estructura completa actualizada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'
ORDER BY ordinal_position; 