-- Limpiar políticas existentes de email_config
DROP POLICY IF EXISTS "Admin can manage email config" ON email_config;
DROP POLICY IF EXISTS "Allow authenticated users to manage email config" ON email_config;

-- Crear política que use solo raw_user_meta_data de auth.users
CREATE POLICY "Admin only email config access" ON email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE users.id = auth.uid() 
            AND (users.raw_user_meta_data ->> 'role') IN ('admin', 'administrador')
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

-- Verificar usuarios y sus roles (solo raw_user_meta_data)
SELECT 
    id, 
    email, 
    raw_user_meta_data ->> 'role' as role_from_raw_meta,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;
