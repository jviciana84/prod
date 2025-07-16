-- Crear tabla duc_scraper para almacenar datos del CSV directamente
CREATE TABLE IF NOT EXISTS public.duc_scraper (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campos básicos del CSV
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
    "Código INT" TEXT,
    "Código fabricante" TEXT,
    "Equipamiento de serie" TEXT,
    "Estado" TEXT,
    "Carrocería" TEXT,
    "Vehículo importado" TEXT,
    "Versión" TEXT,
    "Extras" TEXT,
    "BuNo" TEXT,
    "kW (140 CV) S tronic" TEXT,
    
    -- Campos adicionales que puedan venir en el CSV
    "Precio" TEXT,
    "Matrícula" TEXT,
    "Modelo" TEXT,
    "Marca" TEXT,
    "Año" TEXT,
    "Kilometraje" TEXT,
    
    -- Metadatos
    file_name TEXT,
    import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_duc_scraper_matricula ON public.duc_scraper("Matrícula");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_chasis ON public.duc_scraper("Chasis");
CREATE INDEX IF NOT EXISTS idx_duc_scraper_import_date ON public.duc_scraper(import_date);

-- Comentarios para documentar la tabla
COMMENT ON TABLE public.duc_scraper IS 'Tabla para almacenar datos extraídos directamente del CSV de BMW';
COMMENT ON COLUMN public.duc_scraper.file_name IS 'Nombre del archivo CSV original';
COMMENT ON COLUMN public.duc_scraper.import_date IS 'Fecha y hora de importación';

-- Función para limpiar datos antiguos (opcional)
CREATE OR REPLACE FUNCTION clean_old_duc_scraper_data()
RETURNS void AS $$
BEGIN
    -- Eliminar datos más antiguos de 30 días
    DELETE FROM public.duc_scraper 
    WHERE import_date < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql; 