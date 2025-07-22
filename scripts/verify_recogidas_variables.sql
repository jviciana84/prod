-- Verificar que todas las variables de recogidas están correctamente definidas
DO $$
BEGIN
    -- Verificar que la tabla recogidas_pendientes existe y tiene la estructura correcta
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_pendientes') THEN
        RAISE NOTICE '✅ Tabla recogidas_pendientes existe';
        
        -- Verificar columnas necesarias
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_pendientes' AND column_name = 'matricula') THEN
            RAISE NOTICE '✅ Columna matricula existe en recogidas_pendientes';
        ELSE
            RAISE NOTICE '❌ Columna matricula NO existe en recogidas_pendientes';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_pendientes' AND column_name = 'centro_recogida') THEN
            RAISE NOTICE '✅ Columna centro_recogida existe en recogidas_pendientes';
        ELSE
            RAISE NOTICE '❌ Columna centro_recogida NO existe en recogidas_pendientes';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_pendientes' AND column_name = 'materiales') THEN
            RAISE NOTICE '✅ Columna materiales existe en recogidas_pendientes';
        ELSE
            RAISE NOTICE '❌ Columna materiales NO existe en recogidas_pendientes';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Tabla recogidas_pendientes NO existe';
    END IF;
    
    -- Verificar que la tabla recogidas_historial existe y tiene la estructura correcta
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_historial') THEN
        RAISE NOTICE '✅ Tabla recogidas_historial existe';
        
        -- Verificar columnas necesarias
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_historial' AND column_name = 'matricula') THEN
            RAISE NOTICE '✅ Columna matricula existe en recogidas_historial';
        ELSE
            RAISE NOTICE '❌ Columna matricula NO existe en recogidas_historial';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_historial' AND column_name = 'centro_recogida') THEN
            RAISE NOTICE '✅ Columna centro_recogida existe en recogidas_historial';
        ELSE
            RAISE NOTICE '❌ Columna centro_recogida NO existe en recogidas_historial';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_historial' AND column_name = 'materiales') THEN
            RAISE NOTICE '✅ Columna materiales existe en recogidas_historial';
        ELSE
            RAISE NOTICE '❌ Columna materiales NO existe en recogidas_historial';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Tabla recogidas_historial NO existe';
    END IF;
    
    -- Verificar que la tabla recogidas_email_config existe y tiene la estructura correcta
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_email_config') THEN
        RAISE NOTICE '✅ Tabla recogidas_email_config existe';
        
        -- Verificar columnas necesarias
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'email_remitente') THEN
            RAISE NOTICE '✅ Columna email_remitente existe en recogidas_email_config';
        ELSE
            RAISE NOTICE '❌ Columna email_remitente NO existe en recogidas_email_config';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'nombre_remitente') THEN
            RAISE NOTICE '✅ Columna nombre_remitente existe en recogidas_email_config';
        ELSE
            RAISE NOTICE '❌ Columna nombre_remitente NO existe en recogidas_email_config';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'asunto_template') THEN
            RAISE NOTICE '✅ Columna asunto_template existe en recogidas_email_config';
        ELSE
            RAISE NOTICE '❌ Columna asunto_template NO existe en recogidas_email_config';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Tabla recogidas_email_config NO existe';
    END IF;
    
    RAISE NOTICE 'Verificación completada';
END $$; 