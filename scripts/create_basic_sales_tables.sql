-- Crear tabla principal de vehículos vendidos
CREATE TABLE sales_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate VARCHAR(10) NOT NULL,
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
    sale_price DECIMAL(12, 2),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de estadísticas de vehículos vendidos
CREATE TABLE sales_vehicles_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES sales_vehicles(id) ON DELETE CASCADE,
    total_days INTEGER DEFAULT 0,
    days_in_payment INTEGER DEFAULT 0,
    days_in_body INTEGER DEFAULT 0,
    days_in_mechanical INTEGER DEFAULT 0,
    days_in_validation INTEGER DEFAULT 0,
    efficiency_score DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de historial de estados
CREATE TABLE sales_vehicles_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES sales_vehicles(id) ON DELETE CASCADE,
    status_type VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255),
    notes TEXT
);

-- Crear tabla de métricas de tiempo
CREATE TABLE sales_vehicles_time_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES sales_vehicles(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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

-- Insertar algunos datos de ejemplo básicos
INSERT INTO sales_vehicles (
    license_plate, model, advisor, payment_method, sale_date,
    payment_status, body_status, mechanical_status, validation_status,
    vehicle_type, work_center, sale_price, customer_name
) VALUES 
    ('1234ABC', 'BMW X5', 'Juan Pérez', 'Contado', NOW() - INTERVAL '30 days',
     'Completado', 'Completado', 'Completado', 'Completado',
     'SUV', 'Centro Principal', 65000.00, 'Carlos Martínez'),
    ('5678DEF', 'Mercedes GLC', 'María López', 'Financiación', NOW() - INTERVAL '25 days',
     'Completado', 'Completado', 'En proceso', 'Pendiente',
     'SUV', 'Centro Secundario', 58000.00, 'Ana García'),
    ('9012GHI', 'Audi A4', 'Carlos Rodríguez', 'Contado', NOW() - INTERVAL '20 days',
     'Completado', 'En proceso', 'Pendiente', 'Pendiente',
     'Sedan', 'Centro Principal', 45000.00, 'Luis Fernández');
