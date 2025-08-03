-- =====================================================
-- AGREGAR COLUMNA ERROR_SUBSANATED A TABLA FOTOS
-- =====================================================
-- Descripción: Nueva columna para trackear errores que han sido subsanados
-- =====================================================

-- 1. Agregar la nueva columna
ALTER TABLE fotos 
ADD COLUMN error_subsanated BOOLEAN DEFAULT FALSE;

-- 2. Agregar comentario para documentar
COMMENT ON COLUMN fotos.error_subsanated IS 'Indica si el error ha sido subsanado (true = subsanado, false = no subsanado)';

-- 3. Crear índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_fotos_error_subsanated ON fotos(error_subsanated);

-- 4. Verificar que se agregó correctamente
SELECT 
    'COLUMNA AGREGADA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fotos' 
AND column_name = 'error_subsanated';

-- 5. Mostrar estructura actualizada de la tabla
SELECT 
    'ESTRUCTURA ACTUALIZADA' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'fotos' 
AND column_name IN ('error_count', 'last_error_by', 'error_subsanated')
ORDER BY column_name;

-- 6. Verificar datos actuales
SELECT 
    'DATOS ACTUALES' as info,
    COUNT(*) as total_vehiculos,
    COUNT(CASE WHEN error_count > 0 THEN 1 END) as con_errores,
    COUNT(CASE WHEN error_count > 0 AND error_subsanated = false THEN 1 END) as errores_no_subsanados,
    COUNT(CASE WHEN error_count > 0 AND error_subsanated = true THEN 1 END) as errores_subsanados
FROM fotos; 