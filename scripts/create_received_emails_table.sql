CREATE TABLE IF NOT EXISTS received_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_email TEXT,
    to_email TEXT,
    subject TEXT,
    plain_text TEXT,
    html_text TEXT,
    message_id TEXT UNIQUE, -- Para evitar duplicados si el poller se ejecuta muy rápido
    received_at TIMESTAMPTZ DEFAULT now(),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    extraction_id UUID REFERENCES pdf_extracted_data(id) ON DELETE SET NULL, -- Enlace a los datos extraídos
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_received_emails_message_id ON received_emails(message_id);
CREATE INDEX IF NOT EXISTS idx_received_emails_received_at ON received_emails(received_at);
CREATE INDEX IF NOT EXISTS idx_received_emails_processed ON received_emails(processed);

COMMENT ON TABLE received_emails IS 'Almacena correos recibidos por el sistema interno de sondeo IMAP.';
COMMENT ON COLUMN received_emails.message_id IS 'Message-ID del correo para posible deduplicación.';
COMMENT ON COLUMN received_emails.extraction_id IS 'Referencia a la entrada en pdf_extracted_data si se procesó exitosamente.';
