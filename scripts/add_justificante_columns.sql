-- Agregar columnas para el justificante de pago
ALTER TABLE extornos ADD COLUMN IF NOT EXISTS justificante_url TEXT;
ALTER TABLE extornos ADD COLUMN IF NOT EXISTS justificante_nombre TEXT;

-- Crear índice para mejorar búsquedas por justificante
CREATE INDEX IF NOT EXISTS idx_extornos_justificante_url ON extornos(justificante_url) WHERE justificante_url IS NOT NULL;

-- Verificar los cambios
SELECT 'Columnas de justificante añadidas a extornos' as status; 