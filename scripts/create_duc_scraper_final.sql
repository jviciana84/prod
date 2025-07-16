-- =====================================================
-- CREAR TABLA DUC_SCRAPER - COLUMNAS COMPLETAS
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Crear tabla duc_scraper con todas las columnas del CSV de BMW
-- =====================================================

-- Crear tabla duc_scraper con las columnas exactas del CSV
CREATE TABLE IF NOT EXISTS public.duc_scraper (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Columnas exactas del CSV
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
    
    -- Metadatos
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

CREATE TRIGGER update_duc_scraper_updated_at_trigger
    BEFORE UPDATE ON public.duc_scraper
    FOR EACH ROW
    EXECUTE FUNCTION update_duc_scraper_updated_at();

-- Comentarios para documentar la tabla
COMMENT ON TABLE public.duc_scraper IS 'Tabla para almacenar datos extraídos directamente del CSV de BMW';
COMMENT ON COLUMN public.duc_scraper."Chasis" IS 'Número de chasis/VIN del vehículo';
COMMENT ON COLUMN public.duc_scraper."Marca" IS 'Marca del vehículo (BMW, Audi, etc.)';
COMMENT ON COLUMN public.duc_scraper."Concesionario" IS 'Concesionario donde está el vehículo';
COMMENT ON COLUMN public.duc_scraper."Precio" IS 'Precio actual del vehículo';
COMMENT ON COLUMN public.duc_scraper."Disponibilidad" IS 'Estado de disponibilidad del vehículo';
COMMENT ON COLUMN public.duc_scraper.file_name IS 'Nombre del archivo CSV original';
COMMENT ON COLUMN public.duc_scraper.import_date IS 'Fecha y hora de importación';
COMMENT ON COLUMN public.duc_scraper.last_seen_date IS 'Última vez que apareció en el CSV';

-- Función para limpiar datos antiguos (opcional)
CREATE OR REPLACE FUNCTION clean_old_duc_scraper_data(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.duc_scraper 
    WHERE import_date < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Se han eliminado % registros antiguos de duc_scraper', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Mostrar mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'TABLA DUC_SCRAPER CREADA EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Columnas creadas: 85 columnas del CSV + 5 metadatos';
    RAISE NOTICE 'Índices creados: Chasis, Marca, Concesionario, Fechas';
    RAISE NOTICE 'Trigger creado: Actualización automática de updated_at';
    RAISE NOTICE 'Función creada: clean_old_duc_scraper_data()';
    RAISE NOTICE '=====================================================';
END $$; 