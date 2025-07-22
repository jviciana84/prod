-- Verificar la estructura de la tabla recogidas_email_config
DO $$
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_email_config') THEN
        RAISE NOTICE 'Tabla recogidas_email_config existe';
        
        -- Mostrar estructura de la tabla
        RAISE NOTICE 'Estructura de la tabla:';
        FOR col IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'recogidas_email_config'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  %: % (nullable: %, default: %)', 
                col.column_name, col.data_type, col.is_nullable, col.column_default;
        END LOOP;
        
        -- Mostrar datos existentes
        RAISE NOTICE 'Datos existentes:';
        FOR rec IN 
            SELECT * FROM recogidas_email_config
        LOOP
            RAISE NOTICE '  ID: %, Enabled: %, Email Agencia: %, Email Remitente: %, Nombre Remitente: %, Asunto Template: %, CC Emails: %', 
                rec.id, rec.enabled, rec.email_agencia, rec.email_remitente, rec.nombre_remitente, rec.asunto_template, rec.cc_emails;
        END LOOP;
        
    ELSE
        RAISE NOTICE 'Tabla recogidas_email_config NO existe';
    END IF;
END $$; 