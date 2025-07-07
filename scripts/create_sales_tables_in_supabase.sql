-- Crear tabla principal de vehículos vendidos
CREATE TABLE IF NOT EXISTS sales_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    sale_price DECIMAL(12, 2),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de estadísticas de vehículos vendidos
CREATE TABLE IF NOT EXISTS sales_vehicles_stats (
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
CREATE TABLE IF NOT EXISTS sales_vehicles_status_history (
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
CREATE TABLE IF NOT EXISTS sales_vehicles_time_metrics (
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

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_license_plate ON sales_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_sale_date ON sales_vehicles(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_payment_status ON sales_vehicles(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_body_status ON sales_vehicles(body_status);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_mechanical_status ON sales_vehicles(mechanical_status);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_validation_status ON sales_vehicles(validation_status);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_vehicle_type ON sales_vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_work_center ON sales_vehicles(work_center);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_stats_vehicle_id ON sales_vehicles_stats(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_status_history_vehicle_id ON sales_vehicles_status_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_time_metrics_vehicle_id ON sales_vehicles_time_metrics(vehicle_id);

-- Insertar datos de ejemplo en sales_vehicles
INSERT INTO sales_vehicles (
    license_plate, model, advisor, payment_method, sale_date,
    payment_status, body_status, mechanical_status, validation_status,
    vehicle_type, work_center, sale_price, customer_name, customer_email, customer_phone, notes
) VALUES 
    (
        '1234ABC', 'BMW X5', 'Juan Pérez', 'Contado', NOW() - INTERVAL '30 days',
        'Completado', 'Completado', 'Completado', 'Completado',
        'SUV', 'Centro Principal', 65000.00, 'Carlos Martínez', 'carlos@example.com', '600123456', 'Cliente VIP'
    ),
    (
        '5678DEF', 'Mercedes GLC', 'María López', 'Financiación', NOW() - INTERVAL '25 days',
        'Completado', 'Completado', 'En proceso', 'Pendiente',
        'SUV', 'Centro Secundario', 58000.00, 'Ana García', 'ana@example.com', '600789012', 'Solicita entrega urgente'
    ),
    (
        '9012GHI', 'Audi A4', 'Carlos Rodríguez', 'Contado', NOW() - INTERVAL '20 days',
        'Completado', 'En proceso', 'Pendiente', 'Pendiente',
        'Sedan', 'Centro Principal', 45000.00, 'Luis Fernández', 'luis@example.com', '600345678', 'Cambio de color solicitado'
    ),
    (
        '3456JKL', 'Volkswagen Golf', 'Laura Sánchez', 'Financiación', NOW() - INTERVAL '15 days',
        'En proceso', 'Pendiente', 'Pendiente', 'Pendiente',
        'Hatchback', 'Centro Principal', 28000.00, 'Elena Díaz', 'elena@example.com', '600901234', 'Primera compra'
    ),
    (
        '7890MNO', 'Porsche Cayenne', 'Roberto Gómez', 'Contado', NOW() - INTERVAL '10 days',
        'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente',
        'SUV', 'Centro Premium', 95000.00, 'Javier Ruiz', 'javier@example.com', '600567890', 'Solicita accesorios adicionales'
    ),
    (
        '2345PQR', 'Tesla Model 3', 'Sofía Martín', 'Financiación', NOW() - INTERVAL '5 days',
        'En proceso', 'Pendiente', 'En proceso', 'Pendiente',
        'Sedan', 'Centro Eléctricos', 52000.00, 'Patricia Álvarez', 'patricia@example.com', '600123789', 'Interesado en cargador doméstico'
    ),
    (
        '6789STU', 'Ford Mustang', 'Daniel Torres', 'Contado', NOW() - INTERVAL '3 days',
        'Completado', 'Pendiente', 'En proceso', 'Pendiente',
        'Coupé', 'Centro Deportivos', 62000.00, 'Miguel Serrano', 'miguel@example.com', '600456123', 'Coleccionista'
    ),
    (
        '0123VWX', 'Hyundai Tucson', 'Carmen Navarro', 'Financiación', NOW() - INTERVAL '2 days',
        'En proceso', 'Pendiente', 'Pendiente', 'Pendiente',
        'SUV', 'Centro Secundario', 32000.00, 'Raquel Molina', 'raquel@example.com', '600789456', 'Cambio por modelo anterior'
    ),
    (
        '4567YZA', 'Kia Sportage', 'Javier Moreno', 'Contado', NOW() - INTERVAL '1 day',
        'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente',
        'SUV', 'Centro Secundario', 29000.00, 'Fernando Castro', 'fernando@example.com', '600234567', 'Primera visita'
    ),
    (
        '8901BCD', 'Lexus RX', 'Isabel Jiménez', 'Financiación', NOW(),
        'Pendiente', 'Pendiente', 'Pendiente', 'Pendiente',
        'SUV', 'Centro Premium', 68000.00, 'Cristina Ortega', 'cristina@example.com', '600890123', 'Interesada en garantía extendida'
    );

-- Insertar datos en sales_vehicles_time_metrics
DO $$
DECLARE
    v_record RECORD;
    v_payment_start TIMESTAMP WITH TIME ZONE;
    v_payment_end TIMESTAMP WITH TIME ZONE;
    v_body_start TIMESTAMP WITH TIME ZONE;
    v_body_end TIMESTAMP WITH TIME ZONE;
    v_mechanical_start TIMESTAMP WITH TIME ZONE;
    v_mechanical_end TIMESTAMP WITH TIME ZONE;
    v_validation_start TIMESTAMP WITH TIME ZONE;
    v_validation_end TIMESTAMP WITH TIME ZONE;
    v_delivery TIMESTAMP WITH TIME ZONE;
BEGIN
    FOR v_record IN SELECT id, sale_date, payment_status, body_status, mechanical_status, validation_status FROM sales_vehicles
    LOOP
        -- Establecer fechas según el estado
        v_payment_start := v_record.sale_date + INTERVAL '1 day';
        v_payment_end := CASE WHEN v_record.payment_status = 'Completado' THEN v_payment_start + INTERVAL '3 days' ELSE NULL END;
        
        v_body_start := CASE WHEN v_record.payment_status = 'Completado' THEN v_payment_end + INTERVAL '1 day' ELSE NULL END;
        v_body_end := CASE WHEN v_record.body_status = 'Completado' THEN v_body_start + INTERVAL '5 days' ELSE NULL END;
        
        v_mechanical_start := CASE WHEN v_record.body_status = 'Completado' THEN v_body_end + INTERVAL '1 day' 
                              WHEN v_record.mechanical_status = 'En proceso' THEN v_record.sale_date + INTERVAL '5 days'
                              ELSE NULL END;
        v_mechanical_end := CASE WHEN v_record.mechanical_status = 'Completado' THEN v_mechanical_start + INTERVAL '4 days' ELSE NULL END;
        
        v_validation_start := CASE WHEN v_record.mechanical_status = 'Completado' THEN v_mechanical_end + INTERVAL '1 day' ELSE NULL END;
        v_validation_end := CASE WHEN v_record.validation_status = 'Completado' THEN v_validation_start + INTERVAL '2 days' ELSE NULL END;
        
        v_delivery := CASE 
                        WHEN v_record.payment_status = 'Completado' AND 
                             v_record.body_status = 'Completado' AND 
                             v_record.mechanical_status = 'Completado' AND 
                             v_record.validation_status = 'Completado' 
                        THEN v_validation_end + INTERVAL '1 day' 
                        ELSE NULL 
                      END;
        
        -- Insertar en la tabla de métricas de tiempo
        INSERT INTO sales_vehicles_time_metrics (
            vehicle_id, start_date, 
            payment_start_date, payment_end_date,
            body_start_date, body_end_date,
            mechanical_start_date, mechanical_end_date,
            validation_start_date, validation_end_date,
            delivery_date
        ) VALUES (
            v_record.id, v_record.sale_date,
            v_payment_start, v_payment_end,
            v_body_start, v_body_end,
            v_mechanical_start, v_mechanical_end,
            v_validation_start, v_validation_end,
            v_delivery
        );
    END LOOP;
END $$;

-- Insertar datos en sales_vehicles_stats
DO $$
DECLARE
    v_record RECORD;
    v_total_days INTEGER;
    v_days_payment INTEGER;
    v_days_body INTEGER;
    v_days_mechanical INTEGER;
    v_days_validation INTEGER;
    v_efficiency DECIMAL(5, 2);
BEGIN
    FOR v_record IN SELECT 
                        sv.id, 
                        svtm.start_date, 
                        svtm.payment_start_date, svtm.payment_end_date,
                        svtm.body_start_date, svtm.body_end_date,
                        svtm.mechanical_start_date, svtm.mechanical_end_date,
                        svtm.validation_start_date, svtm.validation_end_date,
                        svtm.delivery_date
                    FROM sales_vehicles sv
                    JOIN sales_vehicles_time_metrics svtm ON sv.id = svtm.vehicle_id
    LOOP
        -- Calcular días en cada fase
        v_days_payment := CASE 
                            WHEN v_record.payment_start_date IS NOT NULL AND v_record.payment_end_date IS NOT NULL 
                            THEN EXTRACT(DAY FROM (v_record.payment_end_date - v_record.payment_start_date))
                            WHEN v_record.payment_start_date IS NOT NULL 
                            THEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - v_record.payment_start_date))
                            ELSE 0
                          END;
        
        v_days_body := CASE 
                         WHEN v_record.body_start_date IS NOT NULL AND v_record.body_end_date IS NOT NULL 
                         THEN EXTRACT(DAY FROM (v_record.body_end_date - v_record.body_start_date))
                         WHEN v_record.body_start_date IS NOT NULL 
                         THEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - v_record.body_start_date))
                         ELSE 0
                       END;
        
        v_days_mechanical := CASE 
                               WHEN v_record.mechanical_start_date IS NOT NULL AND v_record.mechanical_end_date IS NOT NULL 
                               THEN EXTRACT(DAY FROM (v_record.mechanical_end_date - v_record.mechanical_start_date))
                               WHEN v_record.mechanical_start_date IS NOT NULL 
                               THEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - v_record.mechanical_start_date))
                               ELSE 0
                             END;
        
        v_days_validation := CASE 
                               WHEN v_record.validation_start_date IS NOT NULL AND v_record.validation_end_date IS NOT NULL 
                               THEN EXTRACT(DAY FROM (v_record.validation_end_date - v_record.validation_start_date))
                               WHEN v_record.validation_start_date IS NOT NULL 
                               THEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - v_record.validation_start_date))
                               ELSE 0
                             END;
        
        -- Calcular días totales
        v_total_days := CASE 
                          WHEN v_record.delivery_date IS NOT NULL 
                          THEN EXTRACT(DAY FROM (v_record.delivery_date - v_record.start_date))
                          ELSE EXTRACT(DAY FROM (CURRENT_TIMESTAMP - v_record.start_date))
                        END;
        
        -- Calcular eficiencia (menor es mejor)
        v_efficiency := CASE 
                          WHEN v_total_days > 0 
                          THEN (v_days_payment + v_days_body + v_days_mechanical + v_days_validation)::DECIMAL / v_total_days * 100
                          ELSE 0
                        END;
        
        -- Insertar en la tabla de estadísticas
        INSERT INTO sales_vehicles_stats (
            vehicle_id, total_days, 
            days_in_payment, days_in_body, 
            days_in_mechanical, days_in_validation,
            efficiency_score
        ) VALUES (
            v_record.id, v_total_days,
            v_days_payment, v_days_body,
            v_days_mechanical, v_days_validation,
            v_efficiency
        );
    END LOOP;
END $$;

-- Insertar datos en sales_vehicles_status_history
DO $$
DECLARE
    v_record RECORD;
BEGIN
    FOR v_record IN SELECT id, payment_status, body_status, mechanical_status, validation_status, sale_date FROM sales_vehicles
    LOOP
        -- Historial de pago
        IF v_record.payment_status = 'En proceso' THEN
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'payment', 'Pendiente', 'En proceso', v_record.sale_date + INTERVAL '1 day', 'Sistema'
            );
        ELSIF v_record.payment_status = 'Completado' THEN
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'payment', 'Pendiente', 'En proceso', v_record.sale_date + INTERVAL '1 day', 'Sistema'
            );
            
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'payment', 'En proceso', 'Completado', v_record.sale_date + INTERVAL '4 days', 'Sistema'
            );
        END IF;
        
        -- Historial de carrocería
        IF v_record.body_status = 'En proceso' THEN
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'body', 'Pendiente', 'En proceso', v_record.sale_date + INTERVAL '5 days', 'Sistema'
            );
        ELSIF v_record.body_status = 'Completado' THEN
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'body', 'Pendiente', 'En proceso', v_record.sale_date + INTERVAL '5 days', 'Sistema'
            );
            
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'body', 'En proceso', 'Completado', v_record.sale_date + INTERVAL '10 days', 'Sistema'
            );
        END IF;
        
        -- Historial mecánico
        IF v_record.mechanical_status = 'En proceso' THEN
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'mechanical', 'Pendiente', 'En proceso', v_record.sale_date + INTERVAL '11 days', 'Sistema'
            );
        ELSIF v_record.mechanical_status = 'Completado' THEN
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'mechanical', 'Pendiente', 'En proceso', v_record.sale_date + INTERVAL '11 days', 'Sistema'
            );
            
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'mechanical', 'En proceso', 'Completado', v_record.sale_date + INTERVAL '15 days', 'Sistema'
            );
        END IF;
        
        -- Historial de validación
        IF v_record.validation_status = 'En proceso' THEN
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'validation', 'Pendiente', 'En proceso', v_record.sale_date + INTERVAL '16 days', 'Sistema'
            );
        ELSIF v_record.validation_status = 'Completado' THEN
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'validation', 'Pendiente', 'En proceso', v_record.sale_date + INTERVAL '16 days', 'Sistema'
            );
            
            INSERT INTO sales_vehicles_status_history (
                vehicle_id, status_type, old_status, new_status, changed_at, changed_by
            ) VALUES (
                v_record.id, 'validation', 'En proceso', 'Completado', v_record.sale_date + INTERVAL '18 days', 'Sistema'
            );
        END IF;
    END LOOP;
END $$;

-- Actualizar los días en proceso en la tabla principal
UPDATE sales_vehicles sv
SET days_in_process = (
    SELECT total_days 
    FROM sales_vehicles_stats svs 
    WHERE svs.vehicle_id = sv.id
);

-- Crear políticas RLS para seguridad
ALTER TABLE sales_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_vehicles_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_vehicles_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_vehicles_time_metrics ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso a todos los usuarios autenticados
CREATE POLICY "Allow authenticated access" ON sales_vehicles
    FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated access" ON sales_vehicles_stats
    FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated access" ON sales_vehicles_status_history
    FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated access" ON sales_vehicles_time_metrics
    FOR ALL
    TO authenticated
    USING (true);
