-- Añadir campos de plantilla de email si no existen
DO $$ 
BEGIN
    -- Verificar y añadir greeting_text
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_config' AND column_name = 'greeting_text'
    ) THEN
        ALTER TABLE email_config ADD COLUMN greeting_text TEXT DEFAULT 'Estimados compañeros';
    END IF;

    -- Verificar y añadir farewell_text
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_config' AND column_name = 'farewell_text'
    ) THEN
        ALTER TABLE email_config ADD COLUMN farewell_text TEXT DEFAULT 'Atentamente';
    END IF;

    -- Verificar y añadir rejection_note
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_config' AND column_name = 'rejection_note'
    ) THEN
        ALTER TABLE email_config ADD COLUMN rejection_note TEXT DEFAULT 'Recordamos que disponen de 24 horas laborables para confirmar o rechazar la recepción del material. Transcurrido este plazo, se considerará automáticamente aceptado.';
    END IF;

    -- Verificar y añadir no_reply_note
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_config' AND column_name = 'no_reply_note'
    ) THEN
        ALTER TABLE email_config ADD COLUMN no_reply_note TEXT DEFAULT 'Este es un mensaje automático, por favor no responda a este correo.';
    END IF;

    RAISE NOTICE 'Campos de plantilla de email añadidos correctamente';
END $$;

-- Actualizar la configuración existente con valores por defecto más profesionales
UPDATE email_config 
SET 
    greeting_text = COALESCE(greeting_text, 'Estimados compañeros'),
    farewell_text = COALESCE(farewell_text, 'Atentamente'),
    rejection_note = COALESCE(rejection_note, 'Recordamos que disponen de 24 horas laborables para confirmar o rechazar la recepción del material. Transcurrido este plazo, se considerará automáticamente aceptado.'),
    no_reply_note = COALESCE(no_reply_note, 'Este es un mensaje automático, por favor no responda a este correo.')
WHERE id IS NOT NULL;

-- Verificar los cambios
SELECT 
    'Configuración actualizada' as status,
    greeting_text,
    farewell_text,
    rejection_note,
    no_reply_note
FROM email_config 
ORDER BY updated_at DESC 
LIMIT 1;
