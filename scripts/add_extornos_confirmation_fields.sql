-- Añadir campos para el proceso de confirmación de pagos
ALTER TABLE extornos ADD COLUMN IF NOT EXISTS confirmation_token TEXT;
ALTER TABLE extornos ADD COLUMN IF NOT EXISTS pago_confirmado_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE extornos ADD COLUMN IF NOT EXISTS pago_confirmado_por TEXT;

-- Crear índice para el token de confirmación
CREATE INDEX IF NOT EXISTS idx_extornos_confirmation_token ON extornos(confirmation_token);

-- Verificar los cambios
SELECT 'Campos de confirmación añadidos a extornos' as status;
