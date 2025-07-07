-- Agregar el estado "rechazado" a la tabla extornos
-- y campos para tracking de rechazo

-- Primero verificar la estructura actual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'extornos' 
ORDER BY ordinal_position;

-- Agregar campos para el rechazo si no existen
DO $$ 
BEGIN
    -- Agregar fecha de rechazo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extornos' AND column_name = 'fecha_rechazo'
    ) THEN
        ALTER TABLE extornos ADD COLUMN fecha_rechazo TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Agregar quien rechazó
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extornos' AND column_name = 'rechazado_por'
    ) THEN
        ALTER TABLE extornos ADD COLUMN rechazado_por UUID REFERENCES auth.users(id);
    END IF;
    
    -- Agregar motivo del rechazo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extornos' AND column_name = 'motivo_rechazo'
    ) THEN
        ALTER TABLE extornos ADD COLUMN motivo_rechazo TEXT;
    END IF;
END $$;

-- Verificar que los cambios se aplicaron
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'extornos' 
AND column_name IN ('fecha_rechazo', 'rechazado_por', 'motivo_rechazo')
ORDER BY column_name;

-- Mostrar algunos registros para verificar
SELECT id, matricula, estado, fecha_rechazo, rechazado_por, motivo_rechazo
FROM extornos 
ORDER BY created_at DESC 
LIMIT 5;
