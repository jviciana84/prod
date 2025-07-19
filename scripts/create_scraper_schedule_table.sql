-- =====================================================
-- TABLA DE CONFIGURACIÓN DE HORARIOS DEL SCRAPER
-- =====================================================
-- Descripción: Configurar horarios automáticos para el scraper DUC
-- =====================================================

-- Crear tabla de configuración de horarios
CREATE TABLE IF NOT EXISTS public.scraper_schedule_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Configuración básica
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Configuración de horarios
    schedule_type VARCHAR(20) DEFAULT 'daily', -- daily, weekly, custom
    start_time TIME DEFAULT '09:00:00', -- Hora de inicio
    end_time TIME DEFAULT '18:00:00', -- Hora de fin
    interval_minutes INTEGER DEFAULT 60, -- Intervalo en minutos
    
    -- Días de la semana (para schedule_type = 'weekly')
    monday BOOLEAN DEFAULT true,
    tuesday BOOLEAN DEFAULT true,
    wednesday BOOLEAN DEFAULT true,
    thursday BOOLEAN DEFAULT true,
    friday BOOLEAN DEFAULT true,
    saturday BOOLEAN DEFAULT false,
    sunday BOOLEAN DEFAULT false,
    
    -- Configuración de ejecución
    max_executions_per_day INTEGER DEFAULT 8, -- Máximo ejecuciones por día
    last_execution TIMESTAMP WITH TIME ZONE, -- Última ejecución
    next_execution TIMESTAMP WITH TIME ZONE, -- Próxima ejecución programada
    
    -- Configuración de notificaciones
    notify_on_success BOOLEAN DEFAULT true,
    notify_on_error BOOLEAN DEFAULT true,
    notification_email TEXT, -- Email para notificaciones
    
    -- Metadatos
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de historial de ejecuciones
CREATE TABLE IF NOT EXISTS public.scraper_execution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Referencia a la configuración
    schedule_config_id UUID REFERENCES public.scraper_schedule_config(id) ON DELETE CASCADE,
    
    -- Información de la ejecución
    execution_type VARCHAR(20) DEFAULT 'scheduled', -- scheduled, manual, api
    status VARCHAR(20) DEFAULT 'running', -- running, completed, failed, cancelled
    
    -- Resultados
    total_processed INTEGER DEFAULT 0,
    inserted_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    deleted_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Detalles de la ejecución
    file_name TEXT, -- Nombre del archivo procesado
    execution_time_ms INTEGER, -- Tiempo de ejecución en ms
    error_message TEXT, -- Mensaje de error si falló
    
    -- Metadatos
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    triggered_by UUID REFERENCES auth.users(id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_scraper_schedule_config_is_active ON public.scraper_schedule_config(is_active);
CREATE INDEX IF NOT EXISTS idx_scraper_schedule_config_next_execution ON public.scraper_schedule_config(next_execution);
CREATE INDEX IF NOT EXISTS idx_scraper_execution_log_schedule_id ON public.scraper_execution_log(schedule_config_id);
CREATE INDEX IF NOT EXISTS idx_scraper_execution_log_status ON public.scraper_execution_log(status);
CREATE INDEX IF NOT EXISTS idx_scraper_execution_log_started_at ON public.scraper_execution_log(started_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_scraper_schedule_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scraper_schedule_config_updated_at
    BEFORE UPDATE ON public.scraper_schedule_config
    FOR EACH ROW
    EXECUTE FUNCTION update_scraper_schedule_config_updated_at();

-- Función para calcular la próxima ejecución
CREATE OR REPLACE FUNCTION calculate_next_execution(schedule_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    config_record RECORD;
    next_time TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
    current_day_of_week INTEGER := EXTRACT(DOW FROM current_time);
    days_to_add INTEGER := 0;
BEGIN
    -- Obtener la configuración
    SELECT * INTO config_record FROM scraper_schedule_config WHERE id = schedule_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Si no está activo, no programar
    IF NOT config_record.is_active THEN
        RETURN NULL;
    END IF;
    
    -- Calcular próxima ejecución basada en el tipo de horario
    IF config_record.schedule_type = 'daily' THEN
        -- Ejecución diaria
        next_time := current_time::date + config_record.start_time;
        
        -- Si ya pasó la hora de hoy, programar para mañana
        IF next_time <= current_time THEN
            next_time := next_time + INTERVAL '1 day';
        END IF;
        
    ELSIF config_record.schedule_type = 'weekly' THEN
        -- Ejecución semanal
        next_time := current_time::date + config_record.start_time;
        
        -- Buscar el próximo día habilitado
        FOR days_to_add IN 0..6 LOOP
            IF (days_to_add = 0 AND config_record.monday AND current_day_of_week = 1) OR
               (days_to_add = 1 AND config_record.tuesday AND current_day_of_week = 2) OR
               (days_to_add = 2 AND config_record.wednesday AND current_day_of_week = 3) OR
               (days_to_add = 3 AND config_record.thursday AND current_day_of_week = 4) OR
               (days_to_add = 4 AND config_record.friday AND current_day_of_week = 5) OR
               (days_to_add = 5 AND config_record.saturday AND current_day_of_week = 6) OR
               (days_to_add = 6 AND config_record.sunday AND current_day_of_week = 0) THEN
                
                next_time := current_time::date + (days_to_add || ' days')::INTERVAL + config_record.start_time;
                
                -- Si ya pasó la hora de hoy, buscar el siguiente día
                IF next_time <= current_time THEN
                    -- Buscar el siguiente día habilitado
                    FOR days_to_add IN 1..7 LOOP
                        IF (days_to_add = 1 AND config_record.monday) OR
                           (days_to_add = 2 AND config_record.tuesday) OR
                           (days_to_add = 3 AND config_record.wednesday) OR
                           (days_to_add = 4 AND config_record.thursday) OR
                           (days_to_add = 5 AND config_record.friday) OR
                           (days_to_add = 6 AND config_record.saturday) OR
                           (days_to_add = 7 AND config_record.sunday) THEN
                            
                            next_time := current_time::date + (days_to_add || ' days')::INTERVAL + config_record.start_time;
                            EXIT;
                        END IF;
                    END LOOP;
                END IF;
                
                EXIT;
            END IF;
        END LOOP;
        
    ELSE
        -- Horario personalizado - usar intervalo
        next_time := current_time + (config_record.interval_minutes || ' minutes')::INTERVAL;
    END IF;
    
    RETURN next_time;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener configuraciones listas para ejecutar
CREATE OR REPLACE FUNCTION get_ready_schedules()
RETURNS TABLE(
    id UUID,
    name VARCHAR(100),
    schedule_type VARCHAR(20),
    start_time TIME,
    interval_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ssc.id,
        ssc.name,
        ssc.schedule_type,
        ssc.start_time,
        ssc.interval_minutes
    FROM scraper_schedule_config ssc
    WHERE ssc.is_active = true
    AND (ssc.next_execution IS NULL OR ssc.next_execution <= NOW())
    AND (
        -- Verificar límite de ejecuciones por día
        ssc.max_executions_per_day IS NULL OR
        ssc.max_executions_per_day > (
            SELECT COUNT(*) 
            FROM scraper_execution_log sel 
            WHERE sel.schedule_config_id = ssc.id 
            AND sel.started_at >= NOW()::date
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE public.scraper_schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_execution_log ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora)
CREATE POLICY "Allow all operations on scraper_schedule_config" ON public.scraper_schedule_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on scraper_execution_log" ON public.scraper_execution_log FOR ALL USING (true);

-- Insertar configuración por defecto
INSERT INTO public.scraper_schedule_config (
    name, 
    description, 
    schedule_type, 
    start_time, 
    interval_minutes,
    max_executions_per_day
) VALUES (
    'Scraper Automático Diario',
    'Ejecuta el scraper cada hora durante horario laboral',
    'daily',
    '09:00:00',
    60,
    8
) ON CONFLICT DO NOTHING;

-- Comentarios para documentar
COMMENT ON TABLE public.scraper_schedule_config IS 'Configuración de horarios automáticos para el scraper DUC';
COMMENT ON TABLE public.scraper_execution_log IS 'Historial de ejecuciones del scraper DUC';
COMMENT ON FUNCTION calculate_next_execution(UUID) IS 'Calcula la próxima ejecución programada';
COMMENT ON FUNCTION get_ready_schedules() IS 'Obtiene configuraciones listas para ejecutar';

-- Verificar que las tablas se crearon correctamente
SELECT 
    'TABLAS CREADAS' as tipo,
    table_name,
    'OK' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('scraper_schedule_config', 'scraper_execution_log')
ORDER BY table_name; 