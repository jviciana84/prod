-- =====================================================
-- SCRIPT COMPLETO PARA CONFIGURAR LA BASE DE DATOS
-- EN SUPABASE DESDE CERO
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. TABLAS DE CONFIGURACIÓN Y MAESTROS
-- =====================================================

-- Tabla de tipos de gastos
CREATE TABLE IF NOT EXISTS public.expense_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ubicaciones/centros de trabajo
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABLA DE PREFERENCIAS DE USUARIO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'system',
    main_page JSONB,
    favorite_pages JSONB[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- 3. TABLAS PRINCIPALES DE VEHÍCULOS
-- =====================================================

-- Tabla de nuevas entradas
CREATE TABLE IF NOT EXISTS public.nuevas_entradas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'Coche',
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reception_date TIMESTAMP WITH TIME ZONE,
    is_received BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pendiente',
    expense_charge VARCHAR(100),
    expense_type_id UUID REFERENCES public.expense_types(id),
    location_id UUID REFERENCES public.locations(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de stock
CREATE TABLE IF NOT EXISTS public.stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'Coche',
    reception_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mechanical_status VARCHAR(20) DEFAULT 'pendiente',
    mechanical_status_date TIMESTAMP WITH TIME ZONE,
    body_status VARCHAR(20) DEFAULT 'pendiente',
    body_status_date TIMESTAMP WITH TIME ZONE,
    work_center VARCHAR(50),
    external_provider VARCHAR(100),
    or_value TEXT DEFAULT 'ORT',
    expense_charge VARCHAR(100),
    expense_type_id UUID REFERENCES public.expense_types(id),
    location_id UUID REFERENCES public.locations(id),
    nuevas_entradas_id UUID REFERENCES public.nuevas_entradas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de fotos
CREATE TABLE IF NOT EXISTS public.fotos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    disponible TIMESTAMP WITH TIME ZONE,
    estado_pintura VARCHAR(20) DEFAULT 'pendiente',
    paint_status_date TIMESTAMP WITH TIME ZONE,
    paint_apto_date TIMESTAMP WITH TIME ZONE,
    photographer_id UUID,
    photographer_name VARCHAR(100),
    assignment_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    nuevas_entradas_id UUID REFERENCES public.nuevas_entradas(id),
    stock_id UUID REFERENCES public.stock(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABLAS DE VENTAS
-- =====================================================

-- Tabla principal de vehículos vendidos
CREATE TABLE IF NOT EXISTS public.sales_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'Coche',
    document_type VARCHAR(10) DEFAULT 'DNI',
    document_number VARCHAR(20),
    client_name VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    advisor_id UUID,
    advisor_name VARCHAR(100),
    sale_price DECIMAL(12, 2),
    payment_method VARCHAR(50) DEFAULT 'Contado',
    payment_status VARCHAR(50) DEFAULT 'Pendiente',
    body_status VARCHAR(50) DEFAULT 'Pendiente',
    mechanical_status VARCHAR(50) DEFAULT 'Pendiente',
    validation_status VARCHAR(50) DEFAULT 'Pendiente',
    work_center VARCHAR(100),
    days_in_process INTEGER DEFAULT 0,
    notes TEXT,
    stock_id UUID REFERENCES public.stock(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de estadísticas de ventas
CREATE TABLE IF NOT EXISTS public.sales_vehicles_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.sales_vehicles(id) ON DELETE CASCADE,
    total_days INTEGER DEFAULT 0,
    days_in_payment INTEGER DEFAULT 0,
    days_in_body INTEGER DEFAULT 0,
    days_in_mechanical INTEGER DEFAULT 0,
    days_in_validation INTEGER DEFAULT 0,
    efficiency_score DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de estados de ventas
CREATE TABLE IF NOT EXISTS public.sales_vehicles_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.sales_vehicles(id) ON DELETE CASCADE,
    status_type VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by VARCHAR(255),
    notes TEXT
);

-- Tabla de métricas de tiempo de ventas
CREATE TABLE IF NOT EXISTS public.sales_vehicles_time_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.sales_vehicles(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_start_date TIMESTAMP WITH TIME ZONE,
    payment_end_date TIMESTAMP WITH TIME ZONE,
    body_start_date TIMESTAMP WITH TIME ZONE,
    body_end_date TIMESTAMP WITH TIME ZONE,
    mechanical_start_date TIMESTAMP WITH TIME ZONE,
    mechanical_end_date TIMESTAMP WITH TIME ZONE,
    validation_start_date TIMESTAMP WITH TIME ZONE,
    validation_end_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABLAS DE VALIDADOS Y ENTREGAS
-- =====================================================

-- Tabla de pedidos validados
CREATE TABLE IF NOT EXISTS public.pedidos_validados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID,
    license_plate VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'Coche',
    document_type VARCHAR(10) DEFAULT 'DNI',
    document_number VARCHAR(20),
    client_name VARCHAR(100),
    price DECIMAL(10, 2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'Contado',
    status VARCHAR(50) NOT NULL DEFAULT 'Validado',
    validation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    advisor_id UUID,
    advisor_name VARCHAR(100),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de entregas
CREATE TABLE IF NOT EXISTS public.entregas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_entrega TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    matricula TEXT NOT NULL,
    modelo TEXT NOT NULL,
    asesor TEXT NOT NULL,
    or TEXT NOT NULL,
    incidencia BOOLEAN DEFAULT false,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. TABLAS DE GESTIÓN DE LLAVES Y DOCUMENTOS
-- =====================================================

-- Tabla de llaves de vehículos
CREATE TABLE IF NOT EXISTS public.vehicle_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    first_key_status VARCHAR(50) DEFAULT 'En concesionario',
    second_key_status VARCHAR(50) DEFAULT 'En concesionario',
    card_key_status VARCHAR(50) DEFAULT 'En concesionario',
    first_key_location VARCHAR(100),
    second_key_location VARCHAR(100),
    card_key_location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de documentos de vehículos
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    technical_sheet_status VARCHAR(50) DEFAULT 'En concesionario',
    technical_sheet_location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos de llaves
CREATE TABLE IF NOT EXISTS public.key_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_key_id UUID REFERENCES public.vehicle_keys(id) ON DELETE CASCADE,
    key_type VARCHAR(20) NOT NULL, -- 'first', 'second', 'card'
    from_location VARCHAR(100),
    to_location VARCHAR(100) NOT NULL,
    moved_by VARCHAR(100),
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed BOOLEAN DEFAULT false,
    confirmed_by VARCHAR(100),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos de documentos
CREATE TABLE IF NOT EXISTS public.document_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_document_id UUID REFERENCES public.vehicle_documents(id) ON DELETE CASCADE,
    from_location VARCHAR(100),
    to_location VARCHAR(100) NOT NULL,
    moved_by VARCHAR(100),
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed BOOLEAN DEFAULT false,
    confirmed_by VARCHAR(100),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para nuevas_entradas
CREATE INDEX IF NOT EXISTS idx_nuevas_entradas_license_plate ON public.nuevas_entradas(license_plate);
CREATE INDEX IF NOT EXISTS idx_nuevas_entradas_status ON public.nuevas_entradas(status);
CREATE INDEX IF NOT EXISTS idx_nuevas_entradas_is_received ON public.nuevas_entradas(is_received);

-- Índices para stock
CREATE INDEX IF NOT EXISTS idx_stock_license_plate ON public.stock(license_plate);
CREATE INDEX IF NOT EXISTS idx_stock_mechanical_status ON public.stock(mechanical_status);
CREATE INDEX IF NOT EXISTS idx_stock_body_status ON public.stock(body_status);

-- Índices para fotos
CREATE INDEX IF NOT EXISTS idx_fotos_license_plate ON public.fotos(license_plate);
CREATE INDEX IF NOT EXISTS idx_fotos_estado_pintura ON public.fotos(estado_pintura);
CREATE INDEX IF NOT EXISTS idx_fotos_photographer_id ON public.fotos(photographer_id);

-- Índices para sales_vehicles
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_license_plate ON public.sales_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_sale_date ON public.sales_vehicles(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_payment_status ON public.sales_vehicles(payment_status);

-- Índices para entregas
CREATE INDEX IF NOT EXISTS idx_entregas_fecha_venta ON public.entregas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_entregas_fecha_entrega ON public.entregas(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_entregas_matricula ON public.entregas(matricula);

-- Índices para user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- =====================================================
-- 8. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_expense_types_updated_at
    BEFORE UPDATE ON public.expense_types
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nuevas_entradas_updated_at
    BEFORE UPDATE ON public.nuevas_entradas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_updated_at
    BEFORE UPDATE ON public.stock
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fotos_updated_at
    BEFORE UPDATE ON public.fotos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_vehicles_updated_at
    BEFORE UPDATE ON public.sales_vehicles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entregas_updated_at
    BEFORE UPDATE ON public.entregas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_keys_updated_at
    BEFORE UPDATE ON public.vehicle_keys
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_documents_updated_at
    BEFORE UPDATE ON public.vehicle_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Función para copiar de nuevas_entradas a stock
CREATE OR REPLACE FUNCTION public.nuevas_entradas_to_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_received = TRUE AND (OLD.is_received = FALSE OR OLD.is_received IS NULL) THEN
        INSERT INTO public.stock (
            license_plate, 
            model, 
            vehicle_type,
            reception_date,
            expense_charge,
            expense_type_id,
            location_id,
            nuevas_entradas_id
        ) VALUES (
            NEW.license_plate, 
            NEW.model, 
            NEW.vehicle_type,
            COALESCE(NEW.reception_date, NOW()),
            NEW.expense_charge,
            NEW.expense_type_id,
            NEW.location_id,
            NEW.id
        )
        ON CONFLICT (license_plate) 
        DO UPDATE SET 
            model = EXCLUDED.model,
            vehicle_type = EXCLUDED.vehicle_type,
            reception_date = EXCLUDED.reception_date,
            expense_charge = EXCLUDED.expense_charge,
            expense_type_id = EXCLUDED.expense_type_id,
            location_id = EXCLUDED.location_id,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para copiar a stock
CREATE TRIGGER nuevas_entradas_to_stock_trigger
    AFTER UPDATE ON public.nuevas_entradas
    FOR EACH ROW
    EXECUTE FUNCTION public.nuevas_entradas_to_stock();

-- Función para copiar de nuevas_entradas a fotos
CREATE OR REPLACE FUNCTION public.handle_vehicle_received()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_received = TRUE AND (OLD.is_received = FALSE OR OLD.is_received IS NULL) THEN
        INSERT INTO public.fotos (
            license_plate,
            model,
            disponible,
            estado_pintura,
            paint_status_date,
            nuevas_entradas_id
        )
        VALUES (
            NEW.license_plate,
            NEW.model,
            NOW(),
            'pendiente',
            NOW(),
            NEW.id
        )
        ON CONFLICT (license_plate) 
        DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para copiar a fotos
CREATE TRIGGER on_vehicle_received
    AFTER UPDATE ON public.nuevas_entradas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_vehicle_received();

-- Función para sincronizar estado de carrocería con pintura
CREATE OR REPLACE FUNCTION public.sync_body_status_to_paint_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.body_status = 'apto' AND (OLD.body_status != 'apto' OR OLD.body_status IS NULL) THEN
        UPDATE public.fotos
        SET 
            estado_pintura = 'apto',
            paint_status_date = NEW.body_status_date,
            paint_apto_date = NEW.body_status_date
        WHERE 
            license_plate = NEW.license_plate;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar estados
CREATE TRIGGER on_body_status_change
    AFTER UPDATE ON public.stock
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_body_status_to_paint_status();

-- =====================================================
-- 9. FUNCIONES PARA ESTADÍSTICAS
-- =====================================================

-- Función para obtener estadísticas de llaves
CREATE OR REPLACE FUNCTION public.get_key_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_keys', (SELECT COUNT(*) FROM public.vehicle_keys),
        'first_keys_in_dealership', (SELECT COUNT(*) FROM public.vehicle_keys WHERE first_key_status = 'En concesionario'),
        'second_keys_in_dealership', (SELECT COUNT(*) FROM public.vehicle_keys WHERE second_key_status = 'En concesionario'),
        'card_keys_in_dealership', (SELECT COUNT(*) FROM public.vehicle_keys WHERE card_key_status = 'En concesionario'),
        'first_keys_assigned', (SELECT COUNT(*) FROM public.vehicle_keys WHERE first_key_status != 'En concesionario'),
        'second_keys_assigned', (SELECT COUNT(*) FROM public.vehicle_keys WHERE second_key_status != 'En concesionario'),
        'card_keys_assigned', (SELECT COUNT(*) FROM public.vehicle_keys WHERE card_key_status != 'En concesionario'),
        'pending_confirmations', (SELECT COUNT(*) FROM public.key_movements WHERE confirmed = false)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de documentos
CREATE OR REPLACE FUNCTION public.get_document_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_documents', (SELECT COUNT(*) FROM public.vehicle_documents),
        'documents_in_dealership', (SELECT COUNT(*) FROM public.vehicle_documents WHERE technical_sheet_status = 'En concesionario'),
        'documents_assigned', (SELECT COUNT(*) FROM public.vehicle_documents WHERE technical_sheet_status != 'En concesionario'),
        'pending_confirmations', (SELECT COUNT(*) FROM public.document_movements WHERE confirmed = false)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nuevas_entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_vehicles_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_vehicles_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_vehicles_time_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_validados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_movements ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso a usuarios autenticados
CREATE POLICY "Allow authenticated access" ON public.expense_types FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.locations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.user_preferences FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.nuevas_entradas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.stock FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.fotos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.sales_vehicles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.sales_vehicles_stats FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.sales_vehicles_status_history FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.sales_vehicles_time_metrics FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.pedidos_validados FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.entregas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.vehicle_keys FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.vehicle_documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.key_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated access" ON public.document_movements FOR ALL TO authenticated USING (true);

-- =====================================================
-- 11. DATOS INICIALES
-- =====================================================

-- Insertar tipos de gastos por defecto
INSERT INTO public.expense_types (name, description) VALUES
    ('Transporte', 'Gastos de transporte y logística'),
    ('Reparación', 'Gastos de reparación y mantenimiento'),
    ('Documentación', 'Gastos de documentación y trámites'),
    ('Otros', 'Otros gastos diversos')
ON CONFLICT (name) DO NOTHING;

-- Insertar ubicaciones por defecto
INSERT INTO public.locations (name, address, city) VALUES
    ('Centro Principal', 'Calle Principal 123', 'Madrid'),
    ('Centro Secundario', 'Avenida Secundaria 456', 'Barcelona'),
    ('Centro Norte', 'Plaza Norte 789', 'Bilbao')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Añadir comentarios a las tablas principales
COMMENT ON TABLE public.nuevas_entradas IS 'Tabla para registrar nuevos vehículos que ingresan al sistema';
COMMENT ON TABLE public.stock IS 'Tabla principal de vehículos en stock';
COMMENT ON TABLE public.fotos IS 'Tabla para gestionar el estado de fotografías de vehículos';
COMMENT ON TABLE public.sales_vehicles IS 'Tabla principal de vehículos vendidos';
COMMENT ON TABLE public.entregas IS 'Tabla para gestionar las entregas de vehículos a clientes';
COMMENT ON TABLE public.pedidos_validados IS 'Tabla de pedidos que han sido validados';
COMMENT ON TABLE public.vehicle_keys IS 'Tabla para gestionar las llaves de los vehículos';
COMMENT ON TABLE public.vehicle_documents IS 'Tabla para gestionar los documentos de los vehículos';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Verificar que todo se ha creado correctamente
DO $$
BEGIN
    RAISE NOTICE 'Base de datos configurada correctamente. Tablas creadas:';
    RAISE NOTICE '- expense_types, locations, user_preferences';
    RAISE NOTICE '- nuevas_entradas, stock, fotos';
    RAISE NOTICE '- sales_vehicles y tablas relacionadas';
    RAISE NOTICE '- entregas, pedidos_validados';
    RAISE NOTICE '- vehicle_keys, vehicle_documents';
    RAISE NOTICE '- Triggers, funciones e índices configurados';
    RAISE NOTICE '- Políticas RLS habilitadas';
    RAISE NOTICE '- Datos iniciales insertados';
END $$;
