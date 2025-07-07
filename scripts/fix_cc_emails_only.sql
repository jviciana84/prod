-- Ver estado actual
SELECT 'ANTES' as momento, * FROM extornos_email_config;

-- Actualizar solo los CC emails que están vacíos
UPDATE extornos_email_config 
SET 
    cc_emails = ARRAY['jordi.viciana@munichgroup.es'],
    updated_at = NOW()
WHERE id = 1;

-- Ver resultado
SELECT 'DESPUÉS' as momento, * FROM extornos_email_config;
