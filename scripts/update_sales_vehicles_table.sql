-- Añadir nuevas columnas a la tabla sales_vehicles para almacenar datos del PDF
ALTER TABLE sales_vehicles 
ADD COLUMN IF NOT EXISTS pdf_extraction_id UUID,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS client_city TEXT,
ADD COLUMN IF NOT EXISTS client_province TEXT,
ADD COLUMN IF NOT EXISTS client_postal_code TEXT,
ADD COLUMN IF NOT EXISTS document_id TEXT,
ADD COLUMN IF NOT EXISTS vin TEXT,
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS order_date TEXT,
ADD COLUMN IF NOT EXISTS bank TEXT,
ADD COLUMN IF NOT EXISTS discount TEXT,
ADD COLUMN IF NOT EXISTS portal_origin TEXT,
ADD COLUMN IF NOT EXISTS is_resale BOOLEAN DEFAULT FALSE;

-- Añadir índice para búsqueda rápida por pdf_extraction_id
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_pdf_extraction_id ON sales_vehicles(pdf_extraction_id);

-- Añadir índice para búsqueda rápida por document_id
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_document_id ON sales_vehicles(document_id);

-- Añadir índice para búsqueda rápida por vin
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_vin ON sales_vehicles(vin);
