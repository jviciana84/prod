-- Crear tabla para configuración de emails de extornos
CREATE TABLE IF NOT EXISTS extornos_email_config (
    id SERIAL PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    
    -- Emails de los roles
    email_tramitador TEXT, -- Usuario 3: quien revisa y tramita
    email_pagador TEXT,    -- Usuario 4: quien hace los pagos
    cc_emails TEXT[] DEFAULT '{}', -- Usuario 2: emails en copia
    
    -- Configuración del remitente
    sender_email TEXT DEFAULT 'extorno@controlvo.ovh',
    sender_name TEXT DEFAULT 'Sistema CVO - Extornos',
    
    -- Plantillas de correo
    -- Plantilla 1: Registro del extorno
    subject_registro TEXT DEFAULT 'Registro de extorno - {matricula} - {concepto}',
    body_registro TEXT DEFAULT 'Se ha registrado un extorno. El tramitador procederá a revisarlo y tramitarlo.',
    
    -- Plantilla 2: Tramitación/Aceptación
    subject_tramitacion TEXT DEFAULT 'Extorno tramitado - {matricula} - {concepto}',
    body_tramitacion TEXT DEFAULT 'El extorno ha sido revisado y tramitado. Se enviará al responsable de pagos para su procesamiento.',
    
    -- Plantilla 3: Confirmación de pago
    subject_confirmacion TEXT DEFAULT 'Extorno realizado - {matricula} - {concepto}',
    body_confirmacion TEXT DEFAULT 'El pago del extorno se ha completado correctamente.',
    
    -- Textos adicionales
    greeting_text TEXT DEFAULT 'Estimados compañeros',
    farewell_text TEXT DEFAULT 'Atentamente',
    no_reply_note TEXT DEFAULT 'Este es un mensaje automático, por favor no responda a este correo.',
    
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
SELECT 'Tabla extornos_email_config creada correctamente' as status;
