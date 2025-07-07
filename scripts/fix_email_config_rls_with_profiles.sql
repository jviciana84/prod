-- Limpiar políticas existentes de email_config
DROP POLICY IF EXISTS "Admin can manage email config" ON email_config;
DROP POLICY IF EXISTS "Allow authenticated users to manage email config" ON email_config;
DROP POLICY IF EXISTS "Admin only email config access" ON email_config;

-- Crear política que use múltiples fuentes para verificar admin
CREATE POLICY "Admin access to email config" ON email_config
    FOR ALL USING (
        -- Verificar si el usuario actual es admin usando diferentes métodos
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE users.id = auth.uid() 
            AND (
                -- Método 1: raw_user_meta_data
                (users.raw_user_meta_data ->> 'role') IN ('admin', 'administrador')
                OR
                -- Método 2: verificar en tabla profiles si existe
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = users.id 
                    AND profiles.position IN ('admin', 'administrador', 'Admin', 'Administrador')
                )
                OR
                -- Método 3: verificar en tabla users si existe
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() 
                    AND u.role IN ('admin', 'administrador')
                )
                OR
                -- Método 4: verificar en user_roles si existe
                EXISTS (
                    SELECT 1 FROM user_roles ur
                    JOIN roles r ON ur.role_id = r.id
                    WHERE ur.user_id = auth.uid() 
                    AND r.name IN ('admin', 'administrador')
                )
            )
        )
    );

-- Verificar que RLS esté habilitado
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- Verificar las políticas actuales
SELECT 'Políticas RLS actuales:' as info;
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
