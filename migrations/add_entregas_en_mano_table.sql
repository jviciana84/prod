-- Crear tabla para entregas en mano
CREATE TABLE IF NOT EXISTS entregas_en_mano (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL,
    email_cliente VARCHAR(200) NOT NULL,
    materiales TEXT[] NOT NULL, -- Array de materiales a entregar
    nombre_cliente VARCHAR(200), -- Titular del vehículo
    nombre_recoge VARCHAR(200) NOT NULL, -- Persona que recoge la documentación
    dni_recoge VARCHAR(20), -- DNI de quien recoge
    email_recoge VARCHAR(200) NOT NULL, -- Email de quien recoge
    usuario_solicitante VARCHAR(200) NOT NULL,
    usuario_solicitante_id UUID REFERENCES auth.users(id),
    token_confirmacion VARCHAR(64) UNIQUE NOT NULL, -- Token único para confirmación
    estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, confirmada, cancelada
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_confirmacion TIMESTAMP WITH TIME ZONE,
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_matricula ON entregas_en_mano(matricula);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_email ON entregas_en_mano(email_cliente);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_token ON entregas_en_mano(token_confirmacion);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_estado ON entregas_en_mano(estado);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_fecha ON entregas_en_mano(fecha_solicitud);

-- Añadir columna a la tabla entregas para indicar si tiene entrega en mano
ALTER TABLE entregas 
ADD COLUMN IF NOT EXISTS tiene_entrega_en_mano BOOLEAN DEFAULT false;

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_entregas_en_mano_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_update_entregas_en_mano_updated_at ON entregas_en_mano;
CREATE TRIGGER trigger_update_entregas_en_mano_updated_at
    BEFORE UPDATE ON entregas_en_mano
    FOR EACH ROW
    EXECUTE FUNCTION update_entregas_en_mano_updated_at(); 