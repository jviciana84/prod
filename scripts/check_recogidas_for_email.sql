-- Verificar recogidas que se pueden enviar por email
DO $$
DECLARE
    recogidas_pendientes_count INTEGER;
    recogidas_historial_count INTEGER;
    recogidas_sin_envio_count INTEGER;
    recogidas_con_envio_count INTEGER;
    rec RECORD;
BEGIN
    -- Contar recogidas pendientes
    SELECT COUNT(*) INTO recogidas_pendientes_count FROM recogidas_pendientes;
    
    -- Contar recogidas en historial
    SELECT COUNT(*) INTO recogidas_historial_count FROM recogidas_historial;
    
    -- Contar recogidas en historial sin fecha de envío
    SELECT COUNT(*) INTO recogidas_sin_envio_count 
    FROM recogidas_historial 
    WHERE fecha_envio IS NULL;
    
    -- Contar recogidas en historial con fecha de envío
    SELECT COUNT(*) INTO recogidas_con_envio_count 
    FROM recogidas_historial 
    WHERE fecha_envio IS NOT NULL;
    
    RAISE NOTICE '📊 ESTADÍSTICAS DE RECOGIDAS PARA EMAIL:';
    RAISE NOTICE '   Recogidas pendientes: %', recogidas_pendientes_count;
    RAISE NOTICE '   Recogidas en historial: %', recogidas_historial_count;
    RAISE NOTICE '   Sin fecha de envío: %', recogidas_sin_envio_count;
    RAISE NOTICE '   Con fecha de envío: %', recogidas_con_envio_count;
    
    -- Mostrar recogidas pendientes (que se pueden enviar)
    IF recogidas_pendientes_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '📋 RECOGIDAS PENDIENTES (se pueden enviar):';
        FOR rec IN 
            SELECT 
                id,
                matricula,
                centro_recogida,
                nombre_cliente,
                usuario_solicitante,
                fecha_solicitud,
                materiales
            FROM recogidas_pendientes 
            ORDER BY fecha_solicitud DESC 
            LIMIT 10
        LOOP
            RAISE NOTICE '   ID: %, Matrícula: %, Centro: %, Cliente: %, Usuario: %, Fecha: %, Materiales: %', 
                rec.id, rec.matricula, rec.centro_recogida, 
                COALESCE(rec.nombre_cliente, 'No especificado'),
                rec.usuario_solicitante, rec.fecha_solicitud,
                array_to_string(rec.materiales, ', ');
        END LOOP;
        
        IF recogidas_pendientes_count > 10 THEN
            RAISE NOTICE '   ... y % más', recogidas_pendientes_count - 10;
        END IF;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ No hay recogidas pendientes para enviar';
    END IF;
    
    -- Mostrar recogidas en historial sin fecha de envío
    IF recogidas_sin_envio_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '📋 RECOGIDAS EN HISTORIAL SIN ENVÍO:';
        FOR rec IN 
            SELECT 
                id,
                matricula,
                centro_recogida,
                nombre_cliente,
                usuario_solicitante,
                fecha_solicitud,
                materiales
            FROM recogidas_historial 
            WHERE fecha_envio IS NULL
            ORDER BY fecha_solicitud DESC 
            LIMIT 10
        LOOP
            RAISE NOTICE '   ID: %, Matrícula: %, Centro: %, Cliente: %, Usuario: %, Fecha: %, Materiales: %', 
                rec.id, rec.matricula, rec.centro_recogida, 
                COALESCE(rec.nombre_cliente, 'No especificado'),
                rec.usuario_solicitante, rec.fecha_solicitud,
                array_to_string(rec.materiales, ', ');
        END LOOP;
        
        IF recogidas_sin_envio_count > 10 THEN
            RAISE NOTICE '   ... y % más', recogidas_sin_envio_count - 10;
        END IF;
    END IF;
    
    -- Mostrar recogidas enviadas recientemente
    IF recogidas_con_envio_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '📋 ÚLTIMAS RECOGIDAS ENVIADAS:';
        FOR rec IN 
            SELECT 
                id,
                matricula,
                centro_recogida,
                nombre_cliente,
                usuario_solicitante,
                fecha_solicitud,
                fecha_envio
            FROM recogidas_historial 
            WHERE fecha_envio IS NOT NULL
            ORDER BY fecha_envio DESC 
            LIMIT 5
        LOOP
            RAISE NOTICE '   ID: %, Matrícula: %, Centro: %, Cliente: %, Usuario: %, Solicitud: %, Envío: %', 
                rec.id, rec.matricula, rec.centro_recogida, 
                COALESCE(rec.nombre_cliente, 'No especificado'),
                rec.usuario_solicitante, rec.fecha_solicitud, rec.fecha_envio;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '💡 RECOMENDACIONES:';
    IF recogidas_pendientes_count > 0 THEN
        RAISE NOTICE '   ✅ Hay % recogidas pendientes que se pueden enviar por email', recogidas_pendientes_count;
    ELSE
        RAISE NOTICE '   ⚠️ No hay recogidas pendientes para enviar';
    END IF;
    
    IF recogidas_sin_envio_count > 0 THEN
        RAISE NOTICE '   ⚠️ Hay % recogidas en historial sin fecha de envío (pueden ser errores)', recogidas_sin_envio_count;
    END IF;
    
    RAISE NOTICE '   📧 Para enviar emails, usa la función de envío desde la interfaz web';
    
END $$; 