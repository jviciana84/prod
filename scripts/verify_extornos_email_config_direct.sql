SELECT 
    id,
    enabled,
    email_tramitador,
    email_pagador,
    cc_emails,
    created_at,
    updated_at
FROM extornos_email_config
WHERE id = 1;
