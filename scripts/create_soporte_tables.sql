-- Crear tabla de tickets de soporte
CREATE TABLE IF NOT EXISTS soporte_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    client_dni VARCHAR(20) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    sale_date TIMESTAMP WITH TIME ZONE,
    time_since_sale TEXT, -- Ejemplo: "1 año 6 meses 4 días"
    status VARCHAR(50) DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_tramite', 'cerrado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de incidencias por ticket
CREATE TABLE IF NOT EXISTS soporte_incidencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES soporte_tickets(id) ON DELETE CASCADE,
    tipo_incidencia VARCHAR(50) NOT NULL CHECK (tipo_incidencia IN ('Carroceria', 'Mecanica', 'Documentacion', '2ª Llave', 'Limpieza', 'Otros')),
    descripcion TEXT,
    imagenes TEXT[], -- URLs de las imágenes subidas
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_tramite', 'resuelto')),
    respuesta_admin TEXT,
    archivos_admin TEXT[], -- URLs de archivos adjuntos del admin
    respondido_por UUID REFERENCES auth.users(id),
    respondido_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de configuración de emails de soporte
CREATE TABLE IF NOT EXISTS soporte_email_config (
    id SERIAL PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    sender_email VARCHAR(255) DEFAULT 'soporte@controlvo.com',
    sender_name VARCHAR(255) DEFAULT 'Sistema CVO - Soporte',
    cc_emails TEXT[] DEFAULT '{}',
    subject_template TEXT DEFAULT 'Ticket Nº {ticket_number} | {license_plate}',
    body_template TEXT DEFAULT 'Estimado cliente,

Se ha registrado correctamente su ticket de soporte.

Detalles del ticket:
- Número de ticket: {ticket_number}
- Fecha de generación: {created_date}
- Tiempo desde la venta: {time_since_sale}
- Email: {client_email}
- Teléfono: {client_phone}

En la mayor brevedad posible será respondido a sus consultas.

Saludos cordiales,
Equipo de Soporte CVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de historial de emails enviados
CREATE TABLE IF NOT EXISTS soporte_email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES soporte_tickets(id) ON DELETE CASCADE,
    email_type VARCHAR(50) NOT NULL, -- 'registro', 'respuesta', 'cierre'
    to_emails TEXT[],
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject TEXT,
    body TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_soporte_tickets_license_plate ON soporte_tickets(license_plate);
CREATE INDEX IF NOT EXISTS idx_soporte_tickets_client_dni ON soporte_tickets(client_dni);
CREATE INDEX IF NOT EXISTS idx_soporte_tickets_status ON soporte_tickets(status);
CREATE INDEX IF NOT EXISTS idx_soporte_tickets_created_at ON soporte_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_soporte_incidencias_ticket_id ON soporte_incidencias(ticket_id);
CREATE INDEX IF NOT EXISTS idx_soporte_incidencias_tipo ON soporte_incidencias(tipo_incidencia);
CREATE INDEX IF NOT EXISTS idx_soporte_incidencias_estado ON soporte_incidencias(estado);
CREATE INDEX IF NOT EXISTS idx_soporte_email_logs_ticket_id ON soporte_email_logs(ticket_id);

-- Crear función para generar número de ticket único
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR AS $$
DECLARE
    ticket_num VARCHAR;
    counter INTEGER;
BEGIN
    -- Obtener el siguiente número de ticket
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 8) AS INTEGER)), 0) + 1
    INTO counter
    FROM soporte_tickets
    WHERE ticket_number LIKE 'TKT-%';
    
    -- Formatear como TKT-YYYYMMDD-XXXX
    ticket_num := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Crear función para calcular tiempo desde la venta
CREATE OR REPLACE FUNCTION calculate_time_since_sale(sale_date TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
DECLARE
    years INTEGER;
    months INTEGER;
    days INTEGER;
    result TEXT;
BEGIN
    -- Calcular diferencias
    years := EXTRACT(YEAR FROM NOW()) - EXTRACT(YEAR FROM sale_date);
    months := EXTRACT(MONTH FROM NOW()) - EXTRACT(MONTH FROM sale_date);
    days := EXTRACT(DAY FROM NOW()) - EXTRACT(DAY FROM sale_date);
    
    -- Ajustar si los días son negativos
    IF days < 0 THEN
        months := months - 1;
        days := days + EXTRACT(DAY FROM (sale_date + INTERVAL '1 month' - sale_date));
    END IF;
    
    -- Ajustar si los meses son negativos
    IF months < 0 THEN
        years := years - 1;
        months := months + 12;
    END IF;
    
    -- Construir texto
    result := '';
    IF years > 0 THEN
        result := result || years || ' año' || CASE WHEN years > 1 THEN 's' ELSE '' END;
    END IF;
    
    IF months > 0 THEN
        IF result != '' THEN result := result || ' '; END IF;
        result := result || months || ' mes' || CASE WHEN months > 1 THEN 'es' ELSE '' END;
    END IF;
    
    IF days > 0 THEN
        IF result != '' THEN result := result || ' '; END IF;
        result := result || days || ' día' || CASE WHEN days > 1 THEN 's' ELSE '' END;
    END IF;
    
    IF result = '' THEN
        result := 'Menos de 1 día';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_soporte_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_soporte_tickets_updated_at
    BEFORE UPDATE ON soporte_tickets
    FOR EACH ROW EXECUTE FUNCTION update_soporte_updated_at();

CREATE TRIGGER update_soporte_incidencias_updated_at
    BEFORE UPDATE ON soporte_incidencias
    FOR EACH ROW EXECUTE FUNCTION update_soporte_updated_at();

-- Insertar configuración por defecto de email
INSERT INTO soporte_email_config (id, enabled, sender_email, sender_name, cc_emails, subject_template, body_template)
VALUES (
    1,
    true,
    'soporte@controlvo.com',
    'Sistema CVO - Soporte',
    ARRAY[]::text[],
    'Ticket Nº {ticket_number} | {license_plate}',
    'Estimado cliente,

Se ha registrado correctamente su ticket de soporte.

Detalles del ticket:
- Número de ticket: {ticket_number}
- Fecha de generación: {created_date}
- Tiempo desde la venta: {time_since_sale}
- Email: {client_email}
- Teléfono: {client_phone}

En la mayor brevedad posible será respondido a sus consultas.

Saludos cordiales,
Equipo de Soporte CVO'
) ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS en las tablas
ALTER TABLE soporte_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE soporte_incidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE soporte_email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE soporte_email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para soporte_tickets (acceso público para clientes)
CREATE POLICY "Public read access to soporte_tickets" ON soporte_tickets
    FOR SELECT USING (true);

CREATE POLICY "Public insert access to soporte_tickets" ON soporte_tickets
    FOR INSERT WITH CHECK (true);

-- Políticas RLS para soporte_incidencias (acceso público para clientes)
CREATE POLICY "Public read access to soporte_incidencias" ON soporte_incidencias
    FOR SELECT USING (true);

CREATE POLICY "Public insert access to soporte_incidencias" ON soporte_incidencias
    FOR INSERT WITH CHECK (true);

-- Políticas RLS para soporte_email_config (solo admins)
CREATE POLICY "Admin access to soporte_email_config" ON soporte_email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'administrador')
        )
    );

-- Políticas RLS para soporte_email_logs (solo admins)
CREATE POLICY "Admin access to soporte_email_logs" ON soporte_email_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'administrador')
        )
    ); 