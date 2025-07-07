-- Añadir columna updated_at a la tabla pdf_extracted_data
ALTER TABLE pdf_extracted_data 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Actualizar registros existentes con la fecha actual
UPDATE pdf_extracted_data 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Verificar que la columna se ha creado correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'pdf_extracted_data' 
AND column_name = 'updated_at';
