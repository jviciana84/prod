-- Crear tabla para registrar acciones de administrador
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

-- Habilitar RLS
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Política para que solo los administradores puedan ver las acciones
CREATE POLICY "Admins can view admin actions" ON admin_actions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role_id IN (1, 5) -- admin roles
        )
    );

-- Política para que solo los administradores puedan insertar acciones
CREATE POLICY "Admins can insert admin actions" ON admin_actions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role_id IN (1, 5) -- admin roles
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE admin_actions IS 'Registro de acciones realizadas por administradores para auditoría';
COMMENT ON COLUMN admin_actions.admin_id IS 'ID del administrador que realizó la acción';
COMMENT ON COLUMN admin_actions.action_type IS 'Tipo de acción realizada (set_password, delete_user, etc.)';
COMMENT ON COLUMN admin_actions.target_user_id IS 'ID del usuario objetivo de la acción (si aplica)';
COMMENT ON COLUMN admin_actions.details IS 'Detalles adicionales de la acción en formato JSON';
