-- Añadir nuevas columnas a la tabla recogidas_email_config si no existen
DO $$
BEGIN
    -- Añadir email_remitente si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'email_remitente') THEN
        ALTER TABLE recogidas_email_config ADD COLUMN email_remitente VARCHAR(200) NOT NULL DEFAULT 'recogidas@controlvo.ovh';
        RAISE NOTICE 'Columna email_remitente añadida';
    ELSE
        RAISE NOTICE 'Columna email_remitente ya existe';
    END IF;

    -- Añadir nombre_remitente si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'nombre_remitente') THEN
        ALTER TABLE recogidas_email_config ADD COLUMN nombre_remitente VARCHAR(200) NOT NULL DEFAULT 'Recogidas - Sistema CVO';
        RAISE NOTICE 'Columna nombre_remitente añadida';
    ELSE
        RAISE NOTICE 'Columna nombre_remitente ya existe';
    END IF;

    -- Añadir asunto_template si no existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'recogidas_email_config' AND column_name = 'asunto_template') THEN
        ALTER TABLE recogidas_email_config ADD COLUMN asunto_template VARCHAR(300) NOT NULL DEFAULT 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes';
        RAISE NOTICE 'Columna asunto_template añadida';
    ELSE
        RAISE NOTICE 'Columna asunto_template ya existe';
    END IF;

    -- Actualizar registros existentes con valores por defecto si las columnas están vacías
    UPDATE recogidas_email_config 
    SET 
        email_remitente = COALESCE(email_remitente, 'recogidas@controlvo.ovh'),
        nombre_remitente = COALESCE(nombre_remitente, 'Recogidas - Sistema CVO'),
        asunto_template = COALESCE(asunto_template, 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes')
    WHERE email_remitente IS NULL OR nombre_remitente IS NULL OR asunto_template IS NULL;

    RAISE NOTICE 'Migración de configuración de email completada';
END $$; 