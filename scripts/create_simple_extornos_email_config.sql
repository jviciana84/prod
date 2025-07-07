-- Paso 2: Crear la nueva tabla simplificada
CREATE TABLE extornos_email_config (
    id SERIAL PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    
    -- Emails de los roles
    email_tramitador TEXT, -- Usuario 3: quien revisa y tramita
    email_pagador TEXT,    -- Usuario 4: quien hace los pagos
    cc_emails TEXT[] DEFAULT '{}', -- Usuario 2: emails en copia
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT 'Tabla extornos_email_config creada' as status;
