-- Paso 0: Asegurarse de que la columna fecha_incidencia exista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incidencias_historial' AND column_name = 'fecha_incidencia'
    ) THEN
        RAISE NOTICE 'Columna fecha_incidencia no encontrada. Creándola...';
        ALTER TABLE incidencias_historial ADD COLUMN fecha_incidencia TIMESTAMPTZ DEFAULT NOW();
    ELSE
        RAISE NOTICE 'Columna fecha_incidencia ya existe.';
    END IF;
END $$;

-- Paso 1: Eliminar la función si existe (para evitar errores si ya existe parcialmente)
DROP FUNCTION IF EXISTS sync_entregas_to_historial();

-- Paso 2: Crear la función de sincronización CORREGIDA
CREATE OR REPLACE FUNCTION sync_entregas_to_historial()
RETURNS void AS $$
DECLARE
    entrega_record RECORD;
    current_tipo_incidencia TEXT; 
    tipos_incidencia_array TEXT[];
BEGIN
    RAISE NOTICE 'Iniciando sincronización de entregas a historial de incidencias...';

    FOR entrega_record IN SELECT matricula, tipos_incidencia, fecha_entrega FROM entregas LOOP
        IF entrega_record.tipos_incidencia IS NOT NULL AND array_length(entrega_record.tipos_incidencia, 1) > 0 THEN
            tipos_incidencia_array := entrega_record.tipos_incidencia;
            RAISE NOTICE 'Procesando matrícula: %, Incidencias: %', entrega_record.matricula, tipos_incidencia_array;

            FOREACH current_tipo_incidencia IN ARRAY tipos_incidencia_array
            LOOP
                IF NOT EXISTS (
                    SELECT 1 FROM incidencias_historial ih
                    WHERE ih.matricula = entrega_record.matricula
                    AND ih.tipo_incidencia = current_tipo_incidencia
                    AND ih.accion = 'añadida'
                    AND ih.resuelta = FALSE
                ) THEN
                    RAISE NOTICE 'Insertando incidencia: %, %', entrega_record.matricula, current_tipo_incidencia;
                    INSERT INTO incidencias_historial (
                        matricula,
                        tipo_incidencia,
                        accion,
                        resuelta,
                        fecha_incidencia, -- Usamos fecha_incidencia
                        user_id 
                    ) VALUES (
                        entrega_record.matricula,
                        current_tipo_incidencia,
                        'añadida', 
                        FALSE,     
                        COALESCE(entrega_record.fecha_entrega, NOW()), 
                        NULL 
                    );
                ELSE
                    RAISE NOTICE 'Incidencia ya existente (activa): %, %', entrega_record.matricula, current_tipo_incidencia;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    RAISE NOTICE 'Sincronización completada.';
END;
$$ LANGUAGE plpgsql;

-- Paso 3: Ejecutar la función de sincronización
SELECT sync_entregas_to_historial();

-- Paso 4: Verificar los resultados
SELECT 
    '--- Verificación de incidencias_historial (después de sincronización) ---' AS "Mensaje";
SELECT 
    matricula,
    tipo_incidencia,
    accion,
    resuelta,
    fecha_incidencia -- Usamos fecha_incidencia
FROM incidencias_historial 
ORDER BY fecha_incidencia DESC;

SELECT 
    '--- Conteo de incidencias activas por tipo (después de sincronización) ---' AS "Mensaje";
SELECT 
    tipo_incidencia,
    COUNT(*) as cantidad
FROM incidencias_historial 
WHERE accion = 'añadida' AND resuelta = false
GROUP BY tipo_incidencia
ORDER BY tipo_incidencia;

SELECT 
    '--- Entregas con incidencias (para comparar) ---' AS "Mensaje";
SELECT 
    matricula,
    tipos_incidencia,
    fecha_entrega
FROM entregas
WHERE tipos_incidencia IS NOT NULL AND array_length(tipos_incidencia, 1) > 0;
