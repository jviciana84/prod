-- Agregar columnas faltantes a pdf_extracted_data
ALTER TABLE pdf_extracted_data 
ADD COLUMN IF NOT EXISTS raw_text TEXT,
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS dealership_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS sales_vehicle_id BIGINT REFERENCES sales_vehicles(id);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_sales_vehicle_id ON pdf_extracted_data(sales_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_dealership_code ON pdf_extracted_data(dealership_code);
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_extraction_method ON pdf_extracted_data(extraction_method);

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'pdf_extracted_data' 
ORDER BY ordinal_position;
