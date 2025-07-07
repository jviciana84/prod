-- Crear tabla principal de vehículos vendidos
CREATE TABLE IF NOT EXISTS sales_vehicles (
    id UUID PRIMARY KEY,
    license_plate VARCHAR(10) NOT NULL UNIQUE,
    model VARCHAR(255) NOT NULL,
    advisor VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(50) DEFAULT 'Pendiente',
    body_status VARCHAR(50) DEFAULT 'Pendiente',
    mechanical_status VARCHAR(50) DEFAULT 'Pendiente',
    validation_status VARCHAR(50) DEFAULT 'Pendiente',
    vehicle_type VARCHAR(100),
    work_center VARCHAR(100),
    days_in_process INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de estadísticas de vehículos vendidos
CREATE TABLE IF NOT EXISTS sales_vehicles_stats (
    id UUID PRIMARY KEY,
    vehicle_id UUID REFERENCES sales_vehicles(id) ON DELETE CASCADE,
    total_days INTEGER DEFAULT 0,
    days_in_payment INTEGER DEFAULT 0,
    days_in_body INTEGER DEFAULT 0,
    days_in_mechanical INTEGER DEFAULT 0,
    days_in_validation INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de historial de estados
CREATE TABLE IF NOT EXISTS sales_vehicles_status_history (
    id UUID PRIMARY KEY,
    vehicle_id UUID REFERENCES sales_vehicles(id) ON DELETE CASCADE,
    status_type VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255),
    notes TEXT
);

-- Crear tabla de métricas de tiempo
CREATE TABLE IF NOT EXISTS sales_vehicles_time_metrics (
    id UUID PRIMARY KEY,
    vehicle_id UUID REFERENCES sales_vehicles(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE,
    payment_start_date TIMESTAMP WITH TIME ZONE,
    payment_end_date TIMESTAMP WITH TIME ZONE,
    body_start_date TIMESTAMP WITH TIME ZONE,
    body_end_date TIMESTAMP WITH TIME ZONE,
    mechanical_start_date TIMESTAMP WITH TIME ZONE,
    mechanical_end_date TIMESTAMP WITH TIME ZONE,
    validation_start_date TIMESTAMP WITH TIME ZONE,
    validation_end_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_license_plate ON sales_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_sale_date ON sales_vehicles(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_stats_vehicle_id ON sales_vehicles_stats(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_status_history_vehicle_id ON sales_vehicles_status_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_time_metrics_vehicle_id ON sales_vehicles_time_metrics(vehicle_id);

-- Crear función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar automáticamente updated_at
CREATE TRIGGER update_sales_vehicles_updated_at
BEFORE UPDATE ON sales_vehicles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_vehicles_stats_updated_at
BEFORE UPDATE ON sales_vehicles_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_vehicles_time_metrics_updated_at
BEFORE UPDATE ON sales_vehicles_time_metrics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Crear función para insertar registros relacionados automáticamente
CREATE OR REPLACE FUNCTION create_sales_vehicle_related_records()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar registro en sales_vehicles_stats
    INSERT INTO sales_vehicles_stats (id, vehicle_id)
    VALUES (gen_random_uuid(), NEW.id);
    
    -- Insertar registro en sales_vehicles_time_metrics
    INSERT INTO sales_vehicles_time_metrics (id, vehicle_id, start_date)
    VALUES (gen_random_uuid(), NEW.id, CURRENT_TIMESTAMP);
    
    -- Insertar registro inicial en el historial
    INSERT INTO sales_vehicles_status_history (id, vehicle_id, status_type, old_status, new_status)
    VALUES 
        (gen_random_uuid(), NEW.id, 'payment', NULL, NEW.payment_status),
        (gen_random_uuid(), NEW.id, 'body', NULL, NEW.body_status),
        (gen_random_uuid(), NEW.id, 'mechanical', NULL, NEW.mechanical_status),
        (gen_random_uuid(), NEW.id, 'validation', NULL, NEW.validation_status);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para insertar registros relacionados automáticamente
CREATE TRIGGER create_sales_vehicle_related_records_trigger
AFTER INSERT ON sales_vehicles
FOR EACH ROW
EXECUTE FUNCTION create_sales_vehicle_related_records();

-- Crear función para actualizar el historial de estados
CREATE OR REPLACE FUNCTION update_sales_vehicle_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar cambios en payment_status
    IF OLD.payment_status <> NEW.payment_status THEN
        INSERT INTO sales_vehicles_status_history (id, vehicle_id, status_type, old_status, new_status)
        VALUES (gen_random_uuid(), NEW.id, 'payment', OLD.payment_status, NEW.payment_status);
        
        -- Actualizar fechas en time_metrics
        IF NEW.payment_status = 'Completado' THEN
            UPDATE sales_vehicles_time_metrics
            SET payment_end_date = CURRENT_TIMESTAMP
            WHERE vehicle_id = NEW.id AND payment_end_date IS NULL;
        ELSIF OLD.payment_status = 'Completado' THEN
            UPDATE sales_vehicles_time_metrics
            SET payment_end_date = NULL
            WHERE vehicle_id = NEW.id;
        ELSIF NEW.payment_status = 'En proceso' AND (OLD.payment_status = 'Pendiente' OR OLD.payment_status = 'Completado') THEN
            UPDATE sales_vehicles_time_metrics
            SET payment_start_date = CURRENT_TIMESTAMP
            WHERE vehicle_id = NEW.id AND payment_start_date IS NULL;
        END IF;
    END IF;
    
    -- Verificar cambios en body_status
    IF OLD.body_status <> NEW.body_status THEN
        INSERT INTO sales_vehicles_status_history (id, vehicle_id, status_type, old_status, new_status)
        VALUES (gen_random_uuid(), NEW.id, 'body', OLD.body_status, NEW.body_status);
        
        -- Actualizar fechas en time_metrics
        IF NEW.body_status = 'Completado' THEN
            UPDATE sales_vehicles_time_metrics
            SET body_end_date = CURRENT_TIMESTAMP
            WHERE vehicle_id = NEW.id AND body_end_date IS NULL;
        ELSIF OLD.body_status = 'Completado' THEN
            UPDATE sales_vehicles_time_metrics
            SET body_end_date = NULL
            WHERE vehicle_id = NEW.id;
        ELSIF NEW.body_status = 'En proceso' AND (OLD.body_status = 'Pendiente' OR OLD.body_status = 'Completado') THEN
            UPDATE sales_vehicles_time_metrics
            SET body_start_date = CURRENT_TIMESTAMP
            WHERE vehicle_id = NEW.id AND body_start_date IS NULL;
        END IF;
    END IF;
    
    -- Verificar cambios en mechanical_status
    IF OLD.mechanical_status <> NEW.mechanical_status THEN
        INSERT INTO sales_vehicles_status_history (id, vehicle_id, status_type, old_status, new_status)
        VALUES (gen_random_uuid(), NEW.id, 'mechanical', OLD.mechanical_status, NEW.mechanical_status);
        
        -- Actualizar fechas en time_metrics
        IF NEW.mechanical_status = 'Completado' THEN
            UPDATE sales_vehicles_time_metrics
            SET mechanical_end_date = CURRENT_TIMESTAMP
            WHERE vehicle_id = NEW.id AND mechanical_end_date IS NULL;
        ELSIF OLD.mechanical_status = 'Completado' THEN
            UPDATE sales_vehicles_time_metrics
            SET mechanical_end_date = NULL
            WHERE vehicle_id = NEW.id;
        ELSIF NEW.mechanical_status = 'En proceso' AND (OLD.mechanical_status = 'Pendiente' OR OLD.mechanical_status = 'Completado') THEN
            UPDATE sales_vehicles_time_metrics
            SET mechanical_start_date = CURRENT_TIMESTAMP
            WHERE vehicle_id = NEW.id AND mechanical_start_date IS NULL;
        END IF;
    END IF;
    
    -- Verificar cambios en validation_status
    IF OLD.validation_status <> NEW.validation_status THEN
        INSERT INTO sales_vehicles_status_history (id, vehicle_id, status_type, old_status, new_status)
        VALUES (gen_random_uuid(), NEW.id, 'validation', OLD.validation_status, NEW.validation_status);
        
        -- Actualizar fechas en time_metrics
        IF NEW.validation_status = 'Completado' THEN
            UPDATE sales_vehicles_time_metrics
            SET validation_end_date = CURRENT_TIMESTAMP
            WHERE vehicle_id = NEW.id AND validation_end_date IS NULL;
        ELSIF OLD.validation_status = 'Completado' THEN
            UPDATE sales_vehicles_time_metrics
            SET validation_end_date = NULL
            WHERE vehicle_id = NEW.id;
        ELSIF NEW.validation_status = 'En proceso' AND (OLD.validation_status = 'Pendiente' OR OLD.validation_status = 'Completado') THEN
            UPDATE sales_vehicles_time_metrics
            SET validation_start_date = CURRENT_TIMESTAMP
            WHERE vehicle_id = NEW.id AND validation_start_date IS NULL;
        END IF;
    END IF;
    
    -- Verificar si todos los estados están completados para establecer la fecha de entrega
    IF NEW.payment_status = 'Completado' AND NEW.body_status = 'Completado' AND 
       NEW.mechanical_status = 'Completado' AND NEW.validation_status = 'Completado' AND
       (OLD.payment_status <> 'Completado' OR OLD.body_status <> 'Completado' OR 
        OLD.mechanical_status <> 'Completado' OR OLD.validation_status <> 'Completado') THEN
        
        UPDATE sales_vehicles_time_metrics
        SET delivery_date = CURRENT_TIMESTAMP
        WHERE vehicle_id = NEW.id AND delivery_date IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar el historial de estados
CREATE TRIGGER update_sales_vehicle_status_history_trigger
AFTER UPDATE ON sales_vehicles
FOR EACH ROW
WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR 
      OLD.body_status IS DISTINCT FROM NEW.body_status OR 
      OLD.mechanical_status IS DISTINCT FROM NEW.mechanical_status OR 
      OLD.validation_status IS DISTINCT FROM NEW.validation_status)
EXECUTE FUNCTION update_sales_vehicle_status_history();

-- Crear función para actualizar las estadísticas
CREATE OR REPLACE FUNCTION update_sales_vehicle_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_days INTEGER := 0;
    v_body_days INTEGER := 0;
    v_mechanical_days INTEGER := 0;
    v_validation_days INTEGER := 0;
    v_total_days INTEGER := 0;
BEGIN
    -- Calcular días en cada estado
    SELECT 
        CASE 
            WHEN payment_start_date IS NOT NULL AND payment_end_date IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (payment_end_date - payment_start_date))/86400
            WHEN payment_start_date IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - payment_start_date))/86400
            ELSE 0
        END,
        CASE 
            WHEN body_start_date IS NOT NULL AND body_end_date IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (body_end_date - body_start_date))/86400
            WHEN body_start_date IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - body_start_date))/86400
            ELSE 0
        END,
        CASE 
            WHEN mechanical_start_date IS NOT NULL AND mechanical_end_date IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (mechanical_end_date - mechanical_start_date))/86400
            WHEN mechanical_start_date IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - mechanical_start_date))/86400
            ELSE 0
        END,
        CASE 
            WHEN validation_start_date IS NOT NULL AND validation_end_date IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (validation_end_date - validation_start_date))/86400
            WHEN validation_start_date IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - validation_start_date))/86400
            ELSE 0
        END,
        CASE 
            WHEN start_date IS NOT NULL AND delivery_date IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (delivery_date - start_date))/86400
            WHEN start_date IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_date))/86400
            ELSE 0
        END
    INTO v_payment_days, v_body_days, v_mechanical_days, v_validation_days, v_total_days
    FROM sales_vehicles_time_metrics
    WHERE vehicle_id = NEW.vehicle_id;
    
    -- Actualizar estadísticas
    UPDATE sales_vehicles_stats
    SET 
        days_in_payment = ROUND(v_payment_days),
        days_in_body = ROUND(v_body_days),
        days_in_mechanical = ROUND(v_mechanical_days),
        days_in_validation = ROUND(v_validation_days),
        total_days = ROUND(v_total_days)
    WHERE vehicle_id = NEW.vehicle_id;
    
    -- Actualizar días en proceso en la tabla principal
    UPDATE sales_vehicles
    SET days_in_process = ROUND(v_total_days)
    WHERE id = NEW.vehicle_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar las estadísticas
CREATE TRIGGER update_sales_vehicle_stats_trigger
AFTER INSERT OR UPDATE ON sales_vehicles_time_metrics
FOR EACH ROW
EXECUTE FUNCTION update_sales_vehicle_stats();

-- Insertar algunos datos de ejemplo
INSERT INTO sales_vehicles (
    id, license_plate, model, advisor, payment_method, 
    payment_status, body_status, mechanical_status, validation_status,
    vehicle_type, work_center
) VALUES 
    (
        '123e4567-e89b-12d3-a456-426614174000', 
        '1234ABC', 
        'BMW X5', 
        'Juan Pérez', 
        'Contado', 
        'Completado', 
        'En proceso', 
        'Pendiente', 
        'Pendiente',
        'SUV',
        'Principal'
    ),
    (
        '223e4567-e89b-12d3-a456-426614174001', 
        '5678DEF', 
        'Mercedes GLC', 
        'María López', 
        'Financiación', 
        'En proceso', 
        'Pendiente', 
        'Pendiente', 
        'Pendiente',
        'SUV',
        'Secundario'
    ),
    (
        '323e4567-e89b-12d3-a456-426614174002', 
        '9012GHI', 
        'Audi A4', 
        'Carlos Rodríguez', 
        'Contado', 
        'Pendiente', 
        'Pendiente', 
        'Pendiente', 
        'Pendiente',
        'Sedan',
        'Principal'
    );
