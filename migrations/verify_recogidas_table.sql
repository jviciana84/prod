-- Verificar y crear tabla de recogidas si no existe
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_historial') THEN
        -- Crear tabla de historial de recogidas
        CREATE TABLE recogidas_historial (
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
        CREATE INDEX idx_recogidas_matricula ON recogidas_historial(matricula);
        CREATE INDEX idx_recogidas_usuario ON recogidas_historial(usuario_solicitante_id);
        CREATE INDEX idx_recogidas_fecha ON recogidas_historial(fecha_solicitud);
        CREATE INDEX idx_recogidas_estado ON recogidas_historial(estado);

        RAISE NOTICE 'Tabla recogidas_historial creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla recogidas_historial ya existe';
    END IF;

    -- Verificar si existe la tabla de configuración de email
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_email_config') THEN
        -- Crear tabla de configuración de email para recogidas
        CREATE TABLE recogidas_email_config (
            id SERIAL PRIMARY KEY,
            enabled BOOLEAN DEFAULT true,
            email_agencia VARCHAR(200) NOT NULL DEFAULT 'recogidas@mrw.es',
            cc_emails TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Insertar configuración por defecto
        INSERT INTO recogidas_email_config (enabled, email_agencia, cc_emails) 
        VALUES (true, 'recogidas@mrw.es', ARRAY[]::TEXT[]);

        RAISE NOTICE 'Tabla recogidas_email_config creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla recogidas_email_config ya existe';
    END IF;

END $$; 