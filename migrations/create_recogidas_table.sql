-- Crear tabla de historial de recogidas
CREATE TABLE IF NOT EXISTS recogidas_historial (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL,
    mensajeria VARCHAR(50) NOT NULL DEFAULT 'MRW',
    centro_recogida VARCHAR(100) NOT NULL DEFAULT 'Terrassa',
    materiales TEXT[] NOT NULL, -- Array de materiales seleccionados
    nombre_cliente VARCHAR(200),
    direccion_cliente TEXT,
    codigo_postal VARCHAR(10),
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(200),
    observaciones_envio TEXT,
    usuario_solicitante VARCHAR(200) NOT NULL,
    usuario_solicitante_id UUID REFERENCES auth.users(id),
    seguimiento VARCHAR(100), -- Número de seguimiento de la mensajería
    estado VARCHAR(50) DEFAULT 'solicitada', -- solicitada, en_transito, entregada, cancelada
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_envio TIMESTAMP WITH TIME ZONE,
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_recogidas_matricula ON recogidas_historial(matricula);
CREATE INDEX IF NOT EXISTS idx_recogidas_usuario ON recogidas_historial(usuario_solicitante_id);
CREATE INDEX IF NOT EXISTS idx_recogidas_fecha ON recogidas_historial(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_recogidas_estado ON recogidas_historial(estado);

-- Crear tabla de configuración de mensajerías
CREATE TABLE IF NOT EXISTS mensajerias_config (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    email_contacto VARCHAR(200),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar mensajería por defecto
INSERT INTO mensajerias_config (nombre, email_contacto, activa) 
VALUES ('MRW', 'recogidas@mrw.es', true)
ON CONFLICT (nombre) DO NOTHING;

-- Crear tabla de configuración de centros de recogida
CREATE TABLE IF NOT EXISTS centros_recogida_config (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar centro por defecto
INSERT INTO centros_recogida_config (nombre, direccion, activo) 
VALUES ('Terrassa', 'Calle Terrassa, 123', true)
ON CONFLICT (nombre) DO NOTHING;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_recogidas_historial_updated_at 
    BEFORE UPDATE ON recogidas_historial 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mensajerias_config_updated_at 
    BEFORE UPDATE ON mensajerias_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_centros_recogida_config_updated_at 
    BEFORE UPDATE ON centros_recogida_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 