-- Simplificar la tabla de configuración de extornos
-- Solo mantener los emails, no las plantillas

DROP TABLE IF EXISTS extornos_email_config;

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

-- Insertar configuración por defecto
INSERT INTO extornos_email_config (id) VALUES (1) 
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE extornos_email_config ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan acceder
CREATE POLICY "Admin access to extornos_email_config" ON extornos_email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND LOWER(r.name) IN ('admin', 'administrador')
        )
    );

-- Verificar la creación
SELECT 'Tabla extornos_email_config simplificada correctamente' as status;
