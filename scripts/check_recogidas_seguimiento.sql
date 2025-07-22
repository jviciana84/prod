-- Verificar el estado de la columna seguimiento en recogidas
DO $$
BEGIN
    -- Verificar si la tabla recogidas_historial existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_historial') THEN
        RAISE NOTICE '✅ Tabla recogidas_historial existe';
        
        -- Verificar si la columna seguimiento existe
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_historial' AND column_name = 'seguimiento') THEN
            RAISE NOTICE '✅ Columna seguimiento existe en recogidas_historial';
            
            -- Contar registros con seguimiento vacío vs con datos
            DECLARE
                total_records INTEGER;
                empty_seguimiento INTEGER;
                with_seguimiento INTEGER;
            BEGIN
                -- Contar total de registros
                SELECT COUNT(*) INTO total_records FROM recogidas_historial;
                
                -- Contar registros con seguimiento vacío
                SELECT COUNT(*) INTO empty_seguimiento 
                FROM recogidas_historial 
                WHERE seguimiento IS NULL OR seguimiento = '';
                
                -- Contar registros con seguimiento
                SELECT COUNT(*) INTO with_seguimiento 
                FROM recogidas_historial 
                WHERE seguimiento IS NOT NULL AND seguimiento != '';
                
                RAISE NOTICE '📊 Estadísticas de seguimiento:';
                RAISE NOTICE '   Total registros: %', total_records;
                RAISE NOTICE '   Con seguimiento vacío: %', empty_seguimiento;
                RAISE NOTICE '   Con seguimiento: %', with_seguimiento;
                
                -- Mostrar algunos ejemplos de registros con seguimiento
                IF with_seguimiento > 0 THEN
                    RAISE NOTICE '📋 Ejemplos de registros con seguimiento:';
                    FOR rec IN 
                        SELECT matricula, seguimiento, fecha_solicitud 
                        FROM recogidas_historial 
                        WHERE seguimiento IS NOT NULL AND seguimiento != ''
                        LIMIT 5
                    LOOP
                        RAISE NOTICE '   Matrícula: %, Seguimiento: %, Fecha: %', 
                            rec.matricula, rec.seguimiento, rec.fecha_solicitud;
                    END LOOP;
                ELSE
                    RAISE NOTICE '⚠️ No hay registros con seguimiento';
                END IF;
                
                -- Mostrar algunos ejemplos de registros sin seguimiento
                IF empty_seguimiento > 0 THEN
                    RAISE NOTICE '📋 Ejemplos de registros sin seguimiento:';
                    FOR rec IN 
                        SELECT matricula, seguimiento, fecha_solicitud 
                        FROM recogidas_historial 
                        WHERE seguimiento IS NULL OR seguimiento = ''
                        LIMIT 5
                    LOOP
                        RAISE NOTICE '   Matrícula: %, Seguimiento: %, Fecha: %', 
                            rec.matricula, COALESCE(rec.seguimiento, 'NULL'), rec.fecha_solicitud;
                    END LOOP;
                END IF;
            END;
            
        ELSE
            RAISE NOTICE '❌ Columna seguimiento NO existe en recogidas_historial';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Tabla recogidas_historial NO existe';
    END IF;
    
    RAISE NOTICE 'Verificación completada';
END $$; 