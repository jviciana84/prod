-- Añadir la columna otros_observaciones a la tabla incentivos
ALTER TABLE incentivos 
ADD COLUMN IF NOT EXISTS otros_observaciones TEXT;

-- Añadir comentario para documentar la columna
COMMENT ON COLUMN incentivos.otros_observaciones IS 'Observaciones para justificar importes adicionales en el campo otros';

-- Verificar que la columna se ha añadido correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'incentivos' 
AND column_name = 'otros_observaciones';
