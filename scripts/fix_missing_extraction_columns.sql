-- Agregar solo las columnas que realmente faltan para la extracción de PDFs
ALTER TABLE pdf_extracted_data 
ADD COLUMN IF NOT EXISTS raw_text TEXT,
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS dealership_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS sales_vehicle_id BIGINT;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_sales_vehicle_id ON pdf_extracted_data(sales_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_dealership_code ON pdf_extracted_data(dealership_code);

-- Verificar que las columnas se crearon correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pdf_extracted_data' 
AND column_name IN ('raw_text', 'extraction_method', 'dealership_code', 'sales_vehicle_id')
ORDER BY column_name;
