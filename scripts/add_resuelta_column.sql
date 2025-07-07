-- Agregar columna 'resuelta' a la tabla incidencias_historial
ALTER TABLE incidencias_historial 
ADD COLUMN IF NOT EXISTS resuelta BOOLEAN DEFAULT FALSE;

-- Actualizar registros existentes: marcar como resueltas las que tienen acción "eliminada"
UPDATE incidencias_historial 
SET resuelta = TRUE 
WHERE accion = 'eliminada';

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'incidencias_historial' 
ORDER BY ordinal_position;
