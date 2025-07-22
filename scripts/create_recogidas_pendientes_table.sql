-- Crear tabla recogidas_pendientes si no existe
CREATE TABLE IF NOT EXISTS recogidas_pendientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL,
    mensajeria VARCHAR(50) DEFAULT 'MRW',
    centro_recogida VARCHAR(100) DEFAULT 'Terrassa',
    materiales TEXT[] DEFAULT '{}',
    nombre_cliente VARCHAR(200),
    direccion_cliente TEXT,
    codigo_postal VARCHAR(10),
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(200),
    observaciones_envio TEXT,
    usuario_solicitante VARCHAR(200) NOT NULL,
    usuario_solicitante_id UUID,
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_recogidas_pendientes_matricula ON recogidas_pendientes(matricula);
CREATE INDEX IF NOT EXISTS idx_recogidas_pendientes_fecha ON recogidas_pendientes(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_recogidas_pendientes_estado ON recogidas_pendientes(estado);
CREATE INDEX IF NOT EXISTS idx_recogidas_pendientes_usuario ON recogidas_pendientes(usuario_solicitante_id);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_recogidas_pendientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recogidas_pendientes_updated_at
    BEFORE UPDATE ON recogidas_pendientes
    FOR EACH ROW
    EXECUTE FUNCTION update_recogidas_pendientes_updated_at();

-- Verificar que la tabla se creó correctamente
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_pendientes') THEN
        RAISE NOTICE '✅ Tabla recogidas_pendientes creada exitosamente';
        
        -- Mostrar estructura de la tabla
        RAISE NOTICE '📋 Estructura de la tabla:';
        FOR col IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'recogidas_pendientes'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '   %: % (nullable: %, default: %)', 
                col.column_name, col.data_type, col.is_nullable, 
                COALESCE(col.column_default, 'NULL');
        END LOOP;
    ELSE
        RAISE NOTICE '❌ Error: La tabla recogidas_pendientes no se pudo crear';
    END IF;
END $$; 