-- Script completo para arreglar la tabla recogidas_email_config
DO $$
BEGIN
    -- Crear tabla si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recogidas_email_config') THEN
        CREATE TABLE recogidas_email_config (
            id SERIAL PRIMARY KEY,
            enabled BOOLEAN NOT NULL DEFAULT true,
            email_agencia VARCHAR(200) NOT NULL DEFAULT 'recogidas@mrw.es',
            email_remitente VARCHAR(200) NOT NULL DEFAULT 'recogidas@controlvo.ovh',
            nombre_remitente VARCHAR(200) NOT NULL DEFAULT 'Recogidas - Sistema CVO',
            asunto_template VARCHAR(300) NOT NULL DEFAULT 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes',
            cc_emails TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla recogidas_email_config creada';
        
        -- Insertar configuración por defecto
        INSERT INTO recogidas_email_config (enabled, email_agencia, email_remitente, nombre_remitente, asunto_template, cc_emails)
        VALUES (true, 'recogidas@mrw.es', 'recogidas@controlvo.ovh', 'Recogidas - Sistema CVO', 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes', '{}');
        RAISE NOTICE 'Configuración por defecto insertada';
    ELSE
        RAISE NOTICE 'Tabla recogidas_email_config ya existe';
        
        -- Añadir columnas faltantes
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'email_remitente') THEN
            ALTER TABLE recogidas_email_config ADD COLUMN email_remitente VARCHAR(200) NOT NULL DEFAULT 'recogidas@controlvo.ovh';
            RAISE NOTICE 'Columna email_remitente añadida';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'nombre_remitente') THEN
            ALTER TABLE recogidas_email_config ADD COLUMN nombre_remitente VARCHAR(200) NOT NULL DEFAULT 'Recogidas - Sistema CVO';
            RAISE NOTICE 'Columna nombre_remitente añadida';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'asunto_template') THEN
            ALTER TABLE recogidas_email_config ADD COLUMN asunto_template VARCHAR(300) NOT NULL DEFAULT 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes';
            RAISE NOTICE 'Columna asunto_template añadida';
        END IF;
        
        -- Actualizar registros existentes con valores por defecto
        UPDATE recogidas_email_config 
        SET 
            email_remitente = COALESCE(email_remitente, 'recogidas@controlvo.ovh'),
            nombre_remitente = COALESCE(nombre_remitente, 'Recogidas - Sistema CVO'),
            asunto_template = COALESCE(asunto_template, 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes'),
            updated_at = NOW()
        WHERE email_remitente IS NULL OR nombre_remitente IS NULL OR asunto_template IS NULL;
        
        -- Actualizar formato antiguo del asunto
        UPDATE recogidas_email_config 
        SET 
            asunto_template = 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes',
            updated_at = NOW()
        WHERE asunto_template = 'Recogidas Motor Munich - {cantidad} solicitudes';
        
        RAISE NOTICE 'Registros existentes actualizados';
    END IF;
    
    RAISE NOTICE 'Script completado exitosamente';
END $$; 