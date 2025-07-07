-- Paso 4: Configurar RLS y políticas
ALTER TABLE extornos_email_config ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Admin access to extornos_email_config" ON extornos_email_config;

-- Crear nueva política
CREATE POLICY "Admin access to extornos_email_config" ON extornos_email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND LOWER(r.name) IN ('admin', 'administrador')
        )
    );

SELECT 'RLS y políticas configuradas' as status;
