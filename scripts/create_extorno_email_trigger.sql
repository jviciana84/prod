-- Crear función que envía email automáticamente cuando se registra un extorno
CREATE OR REPLACE FUNCTION send_extorno_email_notification()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT;
BEGIN
    -- URL del webhook para enviar email
    webhook_url := 'https://controlvo.ovh/api/extornos/auto-send';
    
    -- Enviar notificación HTTP
    PERFORM net.http_post(
        url := webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
            'extorno_id', NEW.id
        )::text
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Si falla el envío, no bloquear la inserción
        RAISE WARNING 'Error enviando email para extorno %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta después de insertar un extorno
DROP TRIGGER IF EXISTS trigger_send_extorno_email ON extornos;
CREATE TRIGGER trigger_send_extorno_email
    AFTER INSERT ON extornos
    FOR EACH ROW
    EXECUTE FUNCTION send_extorno_email_notification();

-- Verificar que el trigger se creó correctamente
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_send_extorno_email';
