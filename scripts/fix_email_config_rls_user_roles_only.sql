-- Limpiar todas las políticas existentes de email_config
DROP POLICY IF EXISTS "Admin can manage email config" ON email_config;
DROP POLICY IF EXISTS "Allow authenticated users to manage email config" ON email_config;
DROP POLICY IF EXISTS "Admin only email config access" ON email_config;
DROP POLICY IF EXISTS "Admin access to email config" ON email_config;

-- Crear política simple que use solo user_roles
CREATE POLICY "Admin access via user_roles" ON email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('admin', 'administrador')
        )
    );

-- Asegurar que RLS esté habilitado
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- Verificar las políticas actuales
SELECT 'Políticas RLS actuales para email_config:' as info;
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'email_config';
