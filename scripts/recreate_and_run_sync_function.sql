-- Paso 1: Eliminar la función si existe (para evitar errores si ya existe parcialmente)
DROP FUNCTION IF EXISTS sync_entregas_to_historial();

-- Paso 2: Crear la función de sincronización
CREATE OR REPLACE FUNCTION sync_entregas_to_historial()
RETURNS void AS $$
DECLARE
    entrega_record RECORD;
    tipo_incidencia TEXT;
    tipos_incidencia_array TEXT[];
BEGIN
    -- Eliminar registros existentes en incidencias_historial para evitar duplicados si se ejecuta múltiples veces
    -- Opcional: podrías querer mantener el historial completo, pero para este caso de "sincronización"
    -- es más simple limpiar y re-poblar.
    -- DELETE FROM incidencias_historial; 

    FOR entrega_record IN SELECT * FROM entregas LOOP
        -- Asegurarse de que tipos_incidencia no sea NULL
        IF entrega_record.tipos_incidencia IS NOT NULL THEN
            tipos_incidencia_array := entrega_record.tipos_incidencia;

            -- Iterar sobre los tipos de incidencia en el array
            FOREACH tipo_incidencia IN ARRAY tipos_incidencia_array
            LOOP
                -- Verificar si ya existe un registro activo para esta matrícula y tipo_incidencia
                -- Esto es para evitar duplicar si la función se corre varias veces sin limpiar la tabla
                IF NOT EXISTS (
                    SELECT 1 FROM incidencias_historial ih
                    WHERE ih.matricula = entrega_record.matricula
                    AND ih.tipo_incidencia = tipo_incidencia
                    AND ih.accion = 'añadida'
                    AND ih.resuelta = FALSE
                ) THEN
                    INSERT INTO incidencias_historial (
                        matricula,
                        tipo_incidencia,
                        accion,
                        resuelta,
                        created_at,
                        user_id -- Asumiendo que quieres registrar quién hizo el cambio, si está disponible
                                -- Si no, puedes omitir esta columna o poner un valor por defecto
                    ) VALUES (
                        entrega_record.matricula,
                        tipo_incidencia,
                        'añadida', -- Marcamos como 'añadida' ya que viene de la tabla 'entregas'
                        FALSE,     -- Por defecto no está resuelta
                        COALESCE(entrega_record.fecha_entrega, NOW()), -- Usar fecha_entrega si existe, sino NOW()
                        NULL -- O el user_id correspondiente si lo tienes
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Paso 3: Ejecutar la función de sincronización
SELECT sync_entregas_to_historial();

-- Paso 4: Verificar los resultados
RAISE NOTICE '--- Verificación de incidencias_historial ---';
SELECT 
    matricula,
    tipo_incidencia,
    accion,
    resuelta,
    created_at
FROM incidencias_historial 
ORDER BY created_at DESC;

RAISE NOTICE '--- Conteo de incidencias activas por tipo ---';
SELECT 
    tipo_incidencia,
    COUNT(*) as cantidad
FROM incidencias_historial 
WHERE accion = 'añadida' AND resuelta = false
GROUP BY tipo_incidencia
ORDER BY tipo_incidencia;

RAISE NOTICE '--- Entregas con incidencias (para comparar) ---';
SELECT 
    matricula,
    tipos_incidencia,
    fecha_entrega
FROM entregas
WHERE tipos_incidencia IS NOT NULL AND array_length(tipos_incidencia, 1) > 0;
