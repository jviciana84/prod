-- Añadir columna rejected a key_movements
ALTER TABLE key_movements 
ADD COLUMN IF NOT EXISTS rejected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Añadir columna rejected a document_movements  
ALTER TABLE document_movements 
ADD COLUMN IF NOT EXISTS rejected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_key_movements_rejected ON key_movements(rejected);
CREATE INDEX IF NOT EXISTS idx_document_movements_rejected ON document_movements(rejected);

-- Verificar las estructuras
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'key_movements' 
AND column_name IN ('rejected', 'rejected_at');

SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'document_movements' 
AND column_name IN ('rejected', 'rejected_at');
