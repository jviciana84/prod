-- ===================================================================
-- SCRIPT PARA AGREGAR COLUMNAS DE JUSTIFICANTE A LA TABLA EXTORNOS
-- Ejecutar este script en tu base de datos Supabase
-- ===================================================================

-- Agregar columnas para el justificante de pago
ALTER TABLE extornos ADD COLUMN IF NOT EXISTS justificante_url TEXT;
ALTER TABLE extornos ADD COLUMN IF NOT EXISTS justificante_nombre TEXT;

-- Crear índice para mejorar búsquedas por justificante
CREATE INDEX IF NOT EXISTS idx_extornos_justificante_url ON extornos(justificante_url) WHERE justificante_url IS NOT NULL;

-- Verificar los cambios
SELECT 'Columnas de justificante añadidas a extornos' as status;

-- Mostrar la estructura actualizada de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'extornos' 
AND table_schema = 'public'
AND column_name IN ('justificante_url', 'justificante_nombre')
ORDER BY ordinal_position; 