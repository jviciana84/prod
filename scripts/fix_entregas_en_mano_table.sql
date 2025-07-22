-- Verificar estructura actual de la tabla entregas_en_mano
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'entregas_en_mano'
ORDER BY ordinal_position;

-- Añadir columnas faltantes si no existen
DO $$
BEGIN
    -- Añadir fecha_envio si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'fecha_envio'
    ) THEN
        ALTER TABLE entregas_en_mano ADD COLUMN fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna fecha_envio añadida';
    ELSE
        RAISE NOTICE 'Columna fecha_envio ya existe';
    END IF;

    -- Añadir fecha_confirmacion si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'fecha_confirmacion'
    ) THEN
        ALTER TABLE entregas_en_mano ADD COLUMN fecha_confirmacion TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna fecha_confirmacion añadida';
    ELSE
        RAISE NOTICE 'Columna fecha_confirmacion ya existe';
    END IF;

    -- Añadir email_enviado si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'email_enviado'
    ) THEN
        ALTER TABLE entregas_en_mano ADD COLUMN email_enviado BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna email_enviado añadida';
    ELSE
        RAISE NOTICE 'Columna email_enviado ya existe';
    END IF;

    -- Añadir email_enviado_at si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'email_enviado_at'
    ) THEN
        ALTER TABLE entregas_en_mano ADD COLUMN email_enviado_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna email_enviado_at añadida';
    ELSE
        RAISE NOTICE 'Columna email_enviado_at ya existe';
    END IF;

    -- Añadir message_id si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'message_id'
    ) THEN
        ALTER TABLE entregas_en_mano ADD COLUMN message_id VARCHAR(255);
        RAISE NOTICE 'Columna message_id añadida';
    ELSE
        RAISE NOTICE 'Columna message_id ya existe';
    END IF;

    -- Añadir updated_at si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE entregas_en_mano ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at añadida';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe';
    END IF;

    -- Añadir constraint de estado si no existe
    IF NOT EXISTS (
        SELECT FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%entregas_en_mano_estado%'
    ) THEN
        ALTER TABLE entregas_en_mano ADD CONSTRAINT entregas_en_mano_estado_check 
        CHECK (estado IN ('enviado', 'confirmado'));
        RAISE NOTICE 'Constraint de estado añadido';
    ELSE
        RAISE NOTICE 'Constraint de estado ya existe';
    END IF;

END $$;

-- Verificar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'entregas_en_mano'
ORDER BY ordinal_position;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_matricula ON entregas_en_mano(matricula);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_token ON entregas_en_mano(token_confirmacion);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_estado ON entregas_en_mano(estado);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_fecha_envio ON entregas_en_mano(fecha_envio);

-- Crear trigger para actualizar updated_at si no existe
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