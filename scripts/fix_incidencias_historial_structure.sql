-- Verificar la estructura actual de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'incidencias_historial' 
ORDER BY ordinal_position;

-- Agregar la columna matricula si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incidencias_historial' 
        AND column_name = 'matricula'
    ) THEN
        ALTER TABLE incidencias_historial ADD COLUMN matricula TEXT;
    END IF;
END $$;

-- Verificar la estructura después del cambio
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'incidencias_historial' 
ORDER BY ordinal_position;
