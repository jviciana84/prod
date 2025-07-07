-- Mantener políticas RLS para que solo admins puedan configurar
DROP POLICY IF EXISTS "Admin only email config access" ON email_config;
DROP POLICY IF EXISTS "Allow authenticated users to manage email config" ON email_config;

-- Crear política que solo permite acceso a administradores
CREATE POLICY "Admin only email config access" ON email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() 
            AND LOWER(r.name) IN ('admin', 'administrador')
        )
    );

-- Verificar que RLS esté habilitado
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- Crear configuración por defecto si no existe
INSERT INTO email_config (
    id, 
    enabled, 
    sender_email, 
    sender_name, 
    cc_emails, 
    subject_template, 
    body_template
) VALUES (
    1,
    false,
    'material@controlvo.ovh',
    'Sistema CVO - Material',
    ARRAY[]::text[],
    'Entrega de llaves / documentación - {fecha}',
    'Hola,

Registro de entrega de material.

Fecha: {fecha}

Material entregado:
{materiales}

Usuario que entrega: {usuario_entrega}
Usuario que recibe: {usuario_recibe}

Saludos.'
) ON CONFLICT (id) DO NOTHING;

-- Verificar configuración
SELECT * FROM email_config;
