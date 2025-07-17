-- =====================================================
-- CREAR TABLA DUC_SCRAPER - 95 COLUMNAS COMPLETAS
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Crear tabla duc_scraper con las 95 columnas exactas del Excel de BMW
-- =====================================================

-- Crear tabla duc_scraper con las 95 columnas exactas del Excel
CREATE TABLE IF NOT EXISTS public.duc_scraper (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 95 COLUMNAS EXACTAS DEL EXCEL
    "ID Anuncio" TEXT,
    "Anuncio" TEXT,
    "BPS / NEXT" TEXT,
    "Cambio" TEXT,
    "Certificado" TEXT,
    "Chasis" TEXT,
    "Color Carrocería" TEXT,
    "Color tapizado" TEXT,
    "Combustible" TEXT,
    "Concesionario" TEXT,
    "Creado con" TEXT,
    "Destino" TEXT,
    "Disponibilidad" TEXT,
    "Distintivo ambiental" TEXT,
    "Días creado" TEXT,
    "Días desde compra DMS" TEXT,
    "Días desde matriculación" TEXT,
    "Días publicado" TEXT,
    "e-code" TEXT,
    "El precio es" TEXT,
    "En uso" TEXT,
    "Fecha compra DMS" TEXT,
    "Fecha creación" TEXT,
    "Fecha disponibilidad" TEXT,
    "Fecha entrada VO" TEXT,
    "Fecha fabricación" TEXT,
    "Fecha modificación" TEXT,
    "Fecha primera matriculación" TEXT,
    "Fecha primera publicación" TEXT,
    "Garantía" TEXT,
    "KM" TEXT,
    "Libre de siniestros" TEXT,
    "Marca" TEXT,
    "Moneda" TEXT,
    "No completados" TEXT,
    "Nota interna" TEXT,
    "Observaciones" TEXT,
    "Origen" TEXT,
    "Origenes unificados" TEXT,
    "País origen" TEXT,
    "Potencia Cv" TEXT,
    "Precio" TEXT,
    "Precio compra" TEXT,
    "Precio cuota alquiler" TEXT,
    "Precio cuota renting" TEXT,
    "Precio estimado medio" TEXT,
    "Precio exportación" TEXT,
    "Precio financiado" TEXT,
    "Precio vehículo nuevo" TEXT,
    "Precio profesional" TEXT,
    "Proveedor" TEXT,
    "Referencia" TEXT,
    "Referencia interna" TEXT,
    "Regimen fiscal" TEXT,
    "Tienda" TEXT,
    "Tipo de distribución" TEXT,
    "Tipo motor" TEXT,
    "Trancha 1" TEXT,
    "Trancha 2" TEXT,
    "Trancha 3" TEXT,
    "Trancha 4" TEXT,
    "Trancha Combustible" TEXT,
    "Trancha YUC" TEXT,
    "Ubicación tienda" TEXT,
    "URL" TEXT,
    "URL foto 1" TEXT,
    "URL foto 2" TEXT,
    "URL foto 3" TEXT,
    "URL foto 4" TEXT,
    "URL foto 5" TEXT,
    "URL foto 6" TEXT,
    "URL foto 7" TEXT,
    "URL foto 8" TEXT,
    "URL foto 9" TEXT,
    "URL foto 10" TEXT,
    "URL foto 11" TEXT,
    "URL foto 12" TEXT,
    "URL foto 13" TEXT,
    "URL foto 14" TEXT,
    "URL foto 15" TEXT,
    "Válido para certificado" TEXT,
    "Valor existencia" TEXT,
    "Vehículo importado" TEXT,
    "Versión" TEXT,
    "Extras" TEXT,
    "BuNo" TEXT,
    "Código INT" TEXT,
    "Código fabricante" TEXT,
    "Equipamiento de serie" TEXT,
    "Estado" TEXT,
    "Carrocería" TEXT,
    "Días stock" TEXT,
    "Matrícula" TEXT,
    "Modelo" TEXT,
    
    -- METADATOS
    file_name TEXT,
    import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_duc_scraper_chasis ON public.duc_scraper("Chasis");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_marca ON public.duc_scraper("Marca");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_concesionario ON public.duc_scraper("Concesionario");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_matricula ON public.duc_scraper("Matrícula");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_modelo ON public.duc_scraper("Modelo");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_disponibilidad ON public.duc_scraper("Disponibilidad");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_precio ON public.duc_scraper("Precio");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_km ON public.duc_scraper("KM");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_import_date ON public.duc_scraper(import_date);
CREATE INDEX IF NOT EXISTS idx_duc_scraper_last_seen ON public.duc_scraper(last_seen_date);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_duc_scraper_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS trigger_update_duc_scraper_updated_at ON public.duc_scraper;
CREATE TRIGGER trigger_update_duc_scraper_updated_at
    BEFORE UPDATE ON public.duc_scraper
    FOR EACH ROW
    EXECUTE FUNCTION update_duc_scraper_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE public.duc_scraper IS 'Tabla para almacenar datos extraídos del Excel de BMW con 95 columnas';
COMMENT ON COLUMN public.duc_scraper.file_name IS 'Nombre del archivo Excel original';
COMMENT ON COLUMN public.duc_scraper.import_date IS 'Fecha y hora de importación';
COMMENT ON COLUMN public.duc_scraper.last_seen_date IS 'Última fecha en que se vio este registro';

-- Verificar que la tabla se creó correctamente
SELECT 
    COUNT(*) as total_columnas
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public';

-- Mostrar las columnas más importantes para verificación
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'
AND column_name IN ('Matrícula', 'Modelo', 'Marca', 'Precio', 'KM', 'Disponibilidad', 'Días stock')
ORDER BY column_name; 