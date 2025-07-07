-- Limpiar políticas existentes de email_config
DROP POLICY IF EXISTS "Admin can manage email config" ON email_config;
DROP POLICY IF EXISTS "Allow authenticated users to manage email config" ON email_config;

-- Crear política correcta que solo permita acceso a administradores
CREATE POLICY "Admin only email config access" ON email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'administrador')
        )
    );

-- Verificar que RLS esté habilitado
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- Verificar las políticas actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'email_config';

-- Verificar datos actuales
SELECT id, enabled, sender_email, sender_name, cc_emails FROM email_config;
