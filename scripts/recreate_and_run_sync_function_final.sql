-- Paso 1: Eliminar la función si existe (para evitar errores si ya existe parcialmente)
DROP FUNCTION IF EXISTS sync_entregas_to_historial();

-- Paso 2: Crear la función de sincronización con los nombres de columna correctos
CREATE OR REPLACE FUNCTION sync_entregas_to_historial()
RETURNS void AS $$
DECLARE
    entrega_record RECORD;
    current_tipo_incidencia TEXT; -- Renombrada para evitar ambigüedad
    tipos_incidencia_array TEXT[];
BEGIN
    FOR entrega_record IN SELECT * FROM entregas LOOP
        -- Asegurarse de que tipos_incidencia no sea NULL y tenga elementos
        IF entrega_record.tipos_incidencia IS NOT NULL AND array_length(entrega_record.tipos_incidencia, 1) > 0 THEN
            tipos_incidencia_array := entrega_record.tipos_incidencia;

            FOREACH current_tipo_incidencia IN ARRAY tipos_incidencia_array
            LOOP
                -- Verificar si ya existe un registro activo (no resuelto) para esta matrícula y tipo_incidencia
                -- para evitar duplicados si la función se corre varias veces.
                IF NOT EXISTS (
                    SELECT 1 FROM incidencias_historial ih
                    WHERE ih.matricula = entrega_record.matricula
                    AND ih.tipo_incidencia = current_tipo_incidencia
                    AND ih.accion = 'añadida' -- Asumimos que las de 'entregas' son 'añadidas'
                    AND ih.resuelta = FALSE
                ) THEN
                    INSERT INTO incidencias_historial (
                        entrega_id,
                        matricula,
                        tipo_incidencia,
                        accion,
                        resuelta,
                        fecha, -- Usamos la columna 'fecha' de tu tabla
                        usuario_id -- Usamos la columna 'usuario_id'
                        -- usuario_nombre, comentario, fecha_resolucion, estado, matricula_manual se omiten
                        -- ya que no tenemos fuente directa desde la tabla 'entregas' para ellos en este script de sincronización simple.
                        -- Se poblarán con sus defaults o NULL.
                    ) VALUES (
                        entrega_record.id, -- Asumiendo que quieres vincular con el id de la entrega
                        entrega_record.matricula,
                        current_tipo_incidencia,
                        'añadida', -- Marcamos como 'añadida' ya que viene de la tabla 'entregas'
                        FALSE,     -- Por defecto no está resuelta
                        COALESCE(entrega_record.fecha_entrega, NOW()), -- Usar fecha_entrega si existe, sino NOW() para 'fecha'
                        NULL -- O el user_id correspondiente si lo tienes disponible en 'entregas' o un valor fijo
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Paso 3: Ejecutar la función de sincronización
SELECT sync_entregas_to_historial();

-- Paso 4: Verificar los resultados (estas sentencias SELECT mostrarán sus resultados)
SELECT 
    id,
    entrega_id,
    matricula,
    tipo_incidencia,
    accion,
    resuelta,
    fecha,
    usuario_id
FROM incidencias_historial 
ORDER BY fecha DESC;

SELECT 
    tipo_incidencia,
    COUNT(*) as cantidad_activa
FROM incidencias_historial 
WHERE accion = 'añadida' AND resuelta = false
GROUP BY tipo_incidencia
ORDER BY tipo_incidencia;

SELECT 
    matricula,
    tipos_incidencia,
    fecha_entrega
FROM entregas
WHERE tipos_incidencia IS NOT NULL AND array_length(tipos_incidencia, 1) > 0;
