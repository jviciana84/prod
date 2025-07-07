-- Paso 1: Eliminar la función si existe (para evitar errores si ya existe parcialmente)
DROP FUNCTION IF EXISTS sync_entregas_to_historial();

-- Paso 2: Crear la función de sincronización con los nombres de columna correctos y CAST
CREATE OR REPLACE FUNCTION sync_entregas_to_historial()
RETURNS void AS $$
DECLARE
    entrega_record RECORD;
    current_tipo_incidencia TEXT; 
    tipos_incidencia_array TEXT[];
BEGIN
    FOR entrega_record IN SELECT * FROM entregas LOOP
        IF entrega_record.tipos_incidencia IS NOT NULL AND array_length(entrega_record.tipos_incidencia, 1) > 0 THEN
            tipos_incidencia_array := entrega_record.tipos_incidencia;

            FOREACH current_tipo_incidencia IN ARRAY tipos_incidencia_array
            LOOP
                IF NOT EXISTS (
                    SELECT 1 FROM incidencias_historial ih
                    WHERE ih.matricula = entrega_record.matricula
                    AND ih.tipo_incidencia = current_tipo_incidencia
                    AND ih.accion = 'añadida'
                    AND ih.resuelta = FALSE
                ) THEN
                    INSERT INTO incidencias_historial (
                        entrega_id,
                        matricula,
                        tipo_incidencia,
                        accion,
                        resuelta,
                        fecha, 
                        usuario_id 
                    ) VALUES (
                        entrega_record.id::uuid, -- <<-- CAST AÑADIDO AQUÍ
                        entrega_record.matricula,
                        current_tipo_incidencia,
                        'añadida', 
                        FALSE,     
                        COALESCE(entrega_record.fecha_entrega, NOW()), 
                        NULL 
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
    id, -- Para verificar el tipo de id en entregas
    matricula,
    tipos_incidencia,
    fecha_entrega
FROM entregas
WHERE tipos_incidencia IS NOT NULL AND array_length(tipos_incidencia, 1) > 0;

-- Adicional: Verificar el tipo de la columna 'id' en la tabla 'entregas'
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' -- O el esquema donde esté tu tabla
  AND table_name = 'entregas'
  AND column_name = 'id';
