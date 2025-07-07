-- Añadir nuevas columnas a la tabla pdf_extracted_data
ALTER TABLE pdf_extracted_data 
ADD COLUMN IF NOT EXISTS marca TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS kilometros INTEGER,
ADD COLUMN IF NOT EXISTS primera_fecha_matriculacion DATE;

-- Añadir nuevas columnas a la tabla sales_vehicles (si no existen ya)
ALTER TABLE sales_vehicles 
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS mileage INTEGER,
ADD COLUMN IF NOT EXISTS registration_date DATE;

-- Verificar que las columnas se han añadido correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pdf_extracted_data' 
AND column_name IN ('marca', 'color', 'kilometros', 'primera_fecha_matriculacion')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
AND column_name IN ('color', 'mileage', 'registration_date')
ORDER BY column_name;

-- Añadir índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_marca ON pdf_extracted_data(marca);
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_color ON pdf_extracted_data(color);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_color ON sales_vehicles(color);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_registration_date ON sales_vehicles(registration_date);
