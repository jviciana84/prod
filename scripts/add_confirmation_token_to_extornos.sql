-- Añadir columna confirmation_token si no existe
ALTER TABLE extornos 
ADD COLUMN IF NOT EXISTS confirmation_token TEXT;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_extornos_confirmation_token 
ON extornos(confirmation_token);
