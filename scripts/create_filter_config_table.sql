-- =====================================================
-- CREAR TABLA DE CONFIGURACIÓN DE FILTROS
-- =====================================================
-- Descripción: Tabla para almacenar configuraciones de filtros para duc_scraper
-- =====================================================

-- Crear tabla de configuraciones de filtros
CREATE TABLE IF NOT EXISTS public.filter_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información básica
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Filtros de disponibilidad
    disponibilidad_filter TEXT[], -- Array de valores: ['Disponible', 'Reservado', etc.]
    
    -- Filtros de marca
    marca_filter TEXT[], -- Array de marcas: ['BMW', 'Audi', etc.]
    
    -- Filtros de precio
    precio_min DECIMAL(12, 2),
    precio_max DECIMAL(12, 2),
    
    -- Filtros de kilometraje
    km_min INTEGER,
    km_max INTEGER,
    
    -- Filtros de estado
    libre_siniestros BOOLEAN, -- true = solo libre de siniestros
    
    -- Filtros de concesionario
    concesionario_filter TEXT[], -- Array de concesionarios
    
    -- Filtros de combustible
    combustible_filter TEXT[], -- Array: ['Gasolina', 'Diésel', 'Eléctrico', etc.]
    
    -- Filtros de año
    año_min INTEGER,
    año_max INTEGER,
    
    -- Filtros de días en stock
    dias_stock_min INTEGER,
    dias_stock_max INTEGER,
    
    -- Configuración de procesamiento
    max_vehicles_per_batch INTEGER DEFAULT 100, -- Máximo vehículos por lote
    auto_process BOOLEAN DEFAULT false, -- Procesar automáticamente
    
    -- Metadatos
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de historial de procesamiento
CREATE TABLE IF NOT EXISTS public.filter_processing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Referencia a la configuración
    filter_config_id UUID REFERENCES public.filter_configs(id) ON DELETE CASCADE,
    
    -- Resultados del procesamiento
    total_vehicles_found INTEGER DEFAULT 0,
    vehicles_processed INTEGER DEFAULT 0,
    vehicles_added_to_nuevas_entradas INTEGER DEFAULT 0,
    vehicles_skipped INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Estado del procesamiento
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    
    -- Metadatos
    processed_by UUID REFERENCES auth.users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Configuración usada (snapshot)
    config_snapshot JSONB -- Guardar la configuración usada
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_filter_configs_is_active ON public.filter_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_filter_configs_created_by ON public.filter_configs(created_by);
CREATE INDEX IF NOT EXISTS idx_filter_processing_log_config_id ON public.filter_processing_log(filter_config_id);
CREATE INDEX IF NOT EXISTS idx_filter_processing_log_status ON public.filter_processing_log(status);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_filter_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_filter_configs_updated_at
    BEFORE UPDATE ON public.filter_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_filter_configs_updated_at();

-- Comentarios para documentar
COMMENT ON TABLE public.filter_configs IS 'Configuraciones de filtros para procesar duc_scraper';
COMMENT ON TABLE public.filter_processing_log IS 'Historial de procesamiento de filtros';
COMMENT ON COLUMN public.filter_configs.disponibilidad_filter IS 'Array de valores de disponibilidad permitidos';
COMMENT ON COLUMN public.filter_configs.marca_filter IS 'Array de marcas permitidas';
COMMENT ON COLUMN public.filter_configs.precio_min IS 'Precio mínimo en euros';
COMMENT ON COLUMN public.filter_configs.precio_max IS 'Precio máximo en euros';
COMMENT ON COLUMN public.filter_configs.km_min IS 'Kilometraje mínimo';
COMMENT ON COLUMN public.filter_configs.km_max IS 'Kilometraje máximo';
COMMENT ON COLUMN public.filter_configs.libre_siniestros IS 'true = solo vehículos libres de siniestros';
COMMENT ON COLUMN public.filter_configs.concesionario_filter IS 'Array de concesionarios permitidos';
COMMENT ON COLUMN public.filter_configs.combustible_filter IS 'Array de tipos de combustible permitidos';
COMMENT ON COLUMN public.filter_configs.año_min IS 'Año mínimo de fabricación';
COMMENT ON COLUMN public.filter_configs.año_max IS 'Año máximo de fabricación';
COMMENT ON COLUMN public.filter_configs.dias_stock_min IS 'Días mínimo en stock';
COMMENT ON COLUMN public.filter_configs.dias_stock_max IS 'Días máximo en stock'; 