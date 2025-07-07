ALTER TABLE pdf_extracted_data
ADD COLUMN IF NOT EXISTS extraction_source TEXT,
ADD COLUMN IF NOT EXISTS received_email_id UUID REFERENCES received_emails(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS raw_text TEXT,
ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS extraction_errors TEXT;

-- Actualizar registros existentes si es necesario (ejemplo)
-- UPDATE pdf_extracted_data SET extraction_source = 'pdf' WHERE pdf_filename IS NOT NULL AND extraction_source IS NULL;
-- UPDATE pdf_extracted_data SET extraction_status = 'success' WHERE -- (tu condición para éxito previo) -- AND extraction_status = 'pending';

COMMENT ON COLUMN pdf_extracted_data.extraction_source IS 'Indica si los datos fueron extraídos de un PDF o del cuerpo del email.';
COMMENT ON COLUMN pdf_extracted_data.received_email_id IS 'ID del correo original en la tabla received_emails.';
COMMENT ON COLUMN pdf_extracted_data.raw_text IS 'Texto crudo del cual se realizó la extracción (del PDF o del cuerpo del email).';
COMMENT ON COLUMN pdf_extracted_data.extraction_status IS 'Estado de la extracción (success, partial, failed, pending).';
COMMENT ON COLUMN pdf_extracted_data.extraction_errors IS 'Mensajes de error durante la extracción, si los hubo.';
