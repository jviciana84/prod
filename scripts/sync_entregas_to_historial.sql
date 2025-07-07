-- Verificar si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'incidencias_historial') THEN
        CREATE TABLE incidencias_historial (
            id SERIAL PRIMARY KEY,
            matricula TEXT NOT NULL,
            tipo_incidencia TEXT NOT NULL,
            accion TEXT NOT NULL,
            resuelta BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Función para sincronizar incidencias existentes de entregas a historial
CREATE OR REPLACE FUNCTION sync_entregas_to_historial()
RETURNS void AS $$
DECLARE
    entrega_record RECORD;
    tipo_incidencia TEXT;
BEGIN
    -- Limpiar historial existente para evitar duplicados
    DELETE FROM incidencias_historial;
    
    -- Iterar sobre todas las entregas que tienen incidencias
    FOR entrega_record IN 
        SELECT id, matricula, tipos_incidencia, incidencia
        FROM entregas 
        WHERE incidencia = true 
        AND tipos_incidencia IS NOT NULL 
        AND array_length(tipos_incidencia, 1) > 0
    LOOP
        -- Para cada tipo de incidencia en el array
        FOREACH tipo_incidencia IN ARRAY entrega_record.tipos_incidencia
        LOOP
            -- Insertar en el historial como "añadida" y no resuelta
            INSERT INTO incidencias_historial (
                matricula,
                tipo_incidencia,
                accion,
                resuelta,
                created_at
            ) VALUES (
                entrega_record.matricula,
                tipo_incidencia,
                'añadida',
                false,
                NOW()
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Sincronización completada';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la sincronización
SELECT sync_entregas_to_historial();

-- Verificar los resultados
SELECT 
    tipo_incidencia,
    COUNT(*) as cantidad
FROM incidencias_historial 
WHERE accion = 'añadida' AND resuelta = false
GROUP BY tipo_incidencia
ORDER BY tipo_incidencia;
