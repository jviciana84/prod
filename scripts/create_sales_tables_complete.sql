-- Crear tabla para vehículos vendidos
CREATE TABLE IF NOT EXISTS sales_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información básica del vehículo
    license_plate VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    stock_id UUID,  -- Referencia al vehículo en stock original
    
    -- Información de venta
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    advisor_id UUID,  -- ID del asesor/comercial
    advisor_name VARCHAR(100),  -- Nombre del asesor (para búsquedas rápidas)
    sale_price DECIMAL(10, 2),
    payment_method VARCHAR(50),  -- Contado, financiación, etc.
    payment_status VARCHAR(50) DEFAULT 'Pendiente',  -- Pendiente, Parcial, Completado
    
    -- Estados y fechas de revisión post-venta
    body_status VARCHAR(50) DEFAULT 'Pendiente',  -- Estado carrocería
    body_status_date TIMESTAMP WITH TIME ZONE,
    body_status_notes TEXT,
    
    mechanical_status VARCHAR(50) DEFAULT 'Pendiente',  -- Estado mecánica
    mechanical_status_date TIMESTAMP WITH TIME ZONE,
    mechanical_status_notes TEXT,
    
    validation_status VARCHAR(50) DEFAULT 'Pendiente',  -- Validación
    validation_status_date TIMESTAMP WITH TIME ZONE,
    validation_status_by UUID,  -- Quién validó
    
    appraisal_status VARCHAR(50) DEFAULT 'Pendiente',  -- Peritado
    appraisal_status_date TIMESTAMP WITH TIME ZONE,
    appraisal_notes TEXT,
    
    -- Gastos y OR
    or_value DECIMAL(10, 2) DEFAULT 0,
    expense_charge DECIMAL(10, 2) DEFAULT 0,
    expense_type_id UUID,
    
    -- Ubicación
    work_center_id UUID,
    work_center_name VARCHAR(100),
    
    -- Campos para métricas y estadísticas
    days_in_process INTEGER DEFAULT 0,  -- Días desde venta hasta entrega
    delivery_date TIMESTAMP WITH TIME ZONE,  -- Fecha de entrega al cliente
    is_delivered BOOLEAN DEFAULT FALSE,
    
    -- Campos de auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Índices para optimizar consultas y búsquedas
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_license_plate ON sales_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_sale_date ON sales_vehicles(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_advisor_id ON sales_vehicles(advisor_id);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_payment_status ON sales_vehicles(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_is_delivered ON sales_vehicles(is_delivered);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_stock_id ON sales_vehicles(stock_id);

-- Trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_sales_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_vehicles_updated_at
BEFORE UPDATE ON sales_vehicles
FOR EACH ROW
EXECUTE FUNCTION update_sales_vehicles_updated_at();

-- Trigger para calcular automáticamente los días en proceso
CREATE OR REPLACE FUNCTION update_sales_vehicles_days_in_process()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_delivered = TRUE AND NEW.delivery_date IS NOT NULL THEN
        NEW.days_in_process = EXTRACT(DAY FROM NEW.delivery_date - NEW.sale_date);
    ELSE
        NEW.days_in_process = EXTRACT(DAY FROM NOW() - NEW.sale_date);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_vehicles_days_in_process
BEFORE INSERT OR UPDATE ON sales_vehicles
FOR EACH ROW
EXECUTE FUNCTION update_sales_vehicles_days_in_process();

-- Tabla para historial de cambios de estado (para métricas detalladas)
CREATE TABLE IF NOT EXISTS sales_vehicles_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_vehicle_id UUID NOT NULL REFERENCES sales_vehicles(id) ON DELETE CASCADE,
    status_type VARCHAR(50) NOT NULL, -- 'body', 'mechanical', 'validation', 'appraisal', 'payment', etc.
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_vehicles_status_history_vehicle_id ON sales_vehicles_status_history(sales_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_status_history_status_type ON sales_vehicles_status_history(status_type);

-- Trigger para registrar cambios de estado en el historial
CREATE OR REPLACE FUNCTION log_sales_vehicles_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar cambios en estado de carrocería
    IF OLD.body_status IS DISTINCT FROM NEW.body_status THEN
        INSERT INTO sales_vehicles_status_history (
            sales_vehicle_id, status_type, old_status, new_status, changed_by, notes
        ) VALUES (
            NEW.id, 'body', OLD.body_status, NEW.body_status, NEW.updated_by, NEW.body_status_notes
        );
    END IF;
    
    -- Verificar cambios en estado mecánico
    IF OLD.mechanical_status IS DISTINCT FROM NEW.mechanical_status THEN
        INSERT INTO sales_vehicles_status_history (
            sales_vehicle_id, status_type, old_status, new_status, changed_by, notes
        ) VALUES (
            NEW.id, 'mechanical', OLD.mechanical_status, NEW.mechanical_status, NEW.updated_by, NEW.mechanical_status_notes
        );
    END IF;
    
    -- Verificar cambios en estado de validación
    IF OLD.validation_status IS DISTINCT FROM NEW.validation_status THEN
        INSERT INTO sales_vehicles_status_history (
            sales_vehicle_id, status_type, old_status, new_status, changed_by
        ) VALUES (
            NEW.id, 'validation', OLD.validation_status, NEW.validation_status, NEW.updated_by
        );
    END IF;
    
    -- Verificar cambios en estado de peritaje
    IF OLD.appraisal_status IS DISTINCT FROM NEW.appraisal_status THEN
        INSERT INTO sales_vehicles_status_history (
            sales_vehicle_id, status_type, old_status, new_status, changed_by, notes
        ) VALUES (
            NEW.id, 'appraisal', OLD.appraisal_status, NEW.appraisal_status, NEW.updated_by, NEW.appraisal_notes
        );
    END IF;
    
    -- Verificar cambios en estado de pago
    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
        INSERT INTO sales_vehicles_status_history (
            sales_vehicle_id, status_type, old_status, new_status, changed_by
        ) VALUES (
            NEW.id, 'payment', OLD.payment_status, NEW.payment_status, NEW.updated_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_sales_vehicles_status_changes
AFTER UPDATE ON sales_vehicles
FOR EACH ROW
EXECUTE FUNCTION log_sales_vehicles_status_changes();

-- Vista para métricas de tiempo promedio por estado
CREATE OR REPLACE VIEW sales_vehicles_time_metrics AS
WITH status_changes AS (
    SELECT 
        sales_vehicle_id,
        status_type,
        new_status,
        changed_at,
        LEAD(changed_at) OVER (PARTITION BY sales_vehicle_id, status_type ORDER BY changed_at) AS next_change_at
    FROM 
        sales_vehicles_status_history
)
SELECT 
    status_type,
    new_status AS status,
    AVG(EXTRACT(EPOCH FROM (next_change_at - changed_at))/3600) AS avg_hours_in_status,
    COUNT(DISTINCT sales_vehicle_id) AS vehicles_count
FROM 
    status_changes
WHERE 
    next_change_at IS NOT NULL
GROUP BY 
    status_type, new_status;

-- Vista para estadísticas generales de ventas
CREATE OR REPLACE VIEW sales_vehicles_stats AS
SELECT
    COUNT(*) AS total_sales,
    COUNT(CASE WHEN is_delivered = TRUE THEN 1 END) AS delivered_vehicles,
    COUNT(CASE WHEN is_delivered = FALSE THEN 1 END) AS in_process_vehicles,
    AVG(days_in_process) AS avg_days_in_process,
    AVG(sale_price) AS avg_sale_price,
    COUNT(CASE WHEN payment_status = 'Completado' THEN 1 END) AS completed_payments,
    COUNT(CASE WHEN payment_status = 'Pendiente' THEN 1 END) AS pending_payments,
    COUNT(CASE WHEN payment_method = 'Contado' THEN 1 END) AS cash_payments,
    COUNT(CASE WHEN payment_method = 'Financiación' THEN 1 END) AS financed_payments
FROM
    sales_vehicles;

-- Función para transferir un vehículo de stock a ventas
CREATE OR REPLACE FUNCTION transfer_vehicle_to_sales(
    stock_vehicle_id UUID,
    p_advisor_id UUID,
    p_advisor_name VARCHAR,
    p_sale_price DECIMAL,
    p_payment_method VARCHAR,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_stock_record RECORD;
    v_sales_id UUID;
BEGIN
    -- Obtener datos del vehículo en stock
    SELECT * INTO v_stock_record FROM stock WHERE id = stock_vehicle_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Vehículo con ID % no encontrado en stock', stock_vehicle_id;
    END IF;
    
    -- Insertar en la tabla de ventas
    INSERT INTO sales_vehicles (
        license_plate,
        model,
        stock_id,
        sale_date,
        advisor_id,
        advisor_name,
        sale_price,
        payment_method,
        or_value,
        expense_charge,
        expense_type_id,
        work_center_id,
        work_center_name,
        created_by
    ) VALUES (
        v_stock_record.license_plate,
        v_stock_record.model,
        stock_vehicle_id,
        NOW(),
        p_advisor_id,
        p_advisor_name,
        p_sale_price,
        p_payment_method,
        v_stock_record.or_value,
        v_stock_record.expense_charge,
        v_stock_record.expense_type_id,
        v_stock_record.work_center_id,
        v_stock_record.work_center_name,
        p_created_by
    )
    RETURNING id INTO v_sales_id;
    
    -- Actualizar el estado del vehículo en stock (opcional)
    -- UPDATE stock SET status = 'Vendido' WHERE id = stock_vehicle_id;
    
    RETURN v_sales_id;
END;
$$ LANGUAGE plpgsql;
