-- Crear tabla entregas_en_mano si no existe
CREATE TABLE IF NOT EXISTS entregas_en_mano (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL,
    email_cliente VARCHAR(255),
    materiales TEXT[] NOT NULL,
    nombre_cliente VARCHAR(255) NOT NULL,
    usuario_solicitante VARCHAR(255) NOT NULL,
    usuario_solicitante_id UUID,
    nombre_recoge VARCHAR(255) NOT NULL,
    dni_recoge VARCHAR(20),
    email_recoge VARCHAR(255) NOT NULL,
    token_confirmacion VARCHAR(64) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'enviado' CHECK (estado IN ('enviado', 'confirmado')),
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_confirmacion TIMESTAMP WITH TIME ZONE,
    email_enviado BOOLEAN DEFAULT FALSE,
    email_enviado_at TIMESTAMP WITH TIME ZONE,
    message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_matricula ON entregas_en_mano(matricula);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_token ON entregas_en_mano(token_confirmacion);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_estado ON entregas_en_mano(estado);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_fecha_envio ON entregas_en_mano(fecha_envio);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_entregas_en_mano_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_entregas_en_mano_updated_at ON entregas_en_mano;
CREATE TRIGGER trigger_update_entregas_en_mano_updated_at
    BEFORE UPDATE ON entregas_en_mano
    FOR EACH ROW
    EXECUTE FUNCTION update_entregas_en_mano_updated_at();

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'entregas_en_mano';

-- Mostrar la estructura creada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'entregas_en_mano'
ORDER BY ordinal_position; 