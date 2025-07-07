-- 🔧 ARREGLAR CONFIGURACIÓN DE EMAILS DE EXTORNOS

-- 1. Asegurar que existe la configuración
INSERT INTO extornos_email_config (
    id,
    enabled,
    email_tramitador,
    email_pagador,
    cc_emails,
    created_at,
    updated_at
) VALUES (
    1,
    true,  -- ✅ HABILITADO
    'tramitador@motormunich.net',  -- 📧 Cambiar por email real
    'pagos@motormunich.net',       -- 📧 Cambiar por email real
    ARRAY['jordi.viciana@munichgroup.es'],  -- 📧 CC emails
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    email_tramitador = EXCLUDED.email_tramitador,
    email_pagador = EXCLUDED.email_pagador,
    cc_emails = EXCLUDED.cc_emails,
    updated_at = NOW();

-- 2. Verificar que se guardó correctamente
SELECT 
    '✅ CONFIGURACIÓN ACTUALIZADA' as resultado,
    enabled,
    email_tramitador,
    email_pagador,
    cc_emails
FROM extornos_email_config 
WHERE id = 1;
