-- Crear tabla para registrar emails recibidos
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_email TEXT,
  to_email TEXT,
  subject TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla para registrar el procesamiento de PDFs
CREATE TABLE IF NOT EXISTS ocr_processing_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT, -- 'email_attachment', 'pdf_processing', 'data_extraction', 'pdf_error'
  processed_data JSONB,
  error_message TEXT,
  success BOOLEAN DEFAULT TRUE,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla para almacenar datos extraídos de PDFs
CREATE TABLE IF NOT EXISTS pdf_extracted_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_pedido TEXT,
  fecha_pedido DATE,
  nombre_cliente TEXT,
  dni_nif TEXT,
  email TEXT,
  telefono TEXT,
  domicilio TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  provincia TEXT,
  matricula TEXT,
  numero_bastidor TEXT,
  modelo TEXT,
  comercial TEXT,
  portal_origen TEXT,
  banco TEXT,
  total NUMERIC(10,2),
  descuento NUMERIC(10,2),
  pdf_filename TEXT,
  email_subject TEXT,
  extraction_status TEXT DEFAULT 'success',
  extraction_errors TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_created_at ON pdf_extracted_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_numero_pedido ON pdf_extracted_data(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_nombre_cliente ON pdf_extracted_data(nombre_cliente);
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_email ON pdf_extracted_data(email);
CREATE INDEX IF NOT EXISTS idx_pdf_extracted_data_matricula ON pdf_extracted_data(matricula);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_pdf_extracted_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pdf_extracted_data_updated_at_trigger ON pdf_extracted_data;
CREATE TRIGGER update_pdf_extracted_data_updated_at_trigger
BEFORE UPDATE ON pdf_extracted_data
FOR EACH ROW
EXECUTE FUNCTION update_pdf_extracted_data_updated_at();
