-- Añadir campos para documentos adjuntos en la tabla extornos
ALTER TABLE extornos 
ADD COLUMN IF NOT EXISTS documentos_adjuntos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documentos_tramitacion JSONB DEFAULT '[]'::jsonb;

-- Añadir comentarios para documentar los campos
COMMENT ON COLUMN extornos.documentos_adjuntos IS 'Documentos subidos al crear/registrar el extorno';
COMMENT ON COLUMN extornos.documentos_tramitacion IS 'Documentos subidos durante la tramitación del extorno';

-- Crear índices para mejorar consultas JSON
CREATE INDEX IF NOT EXISTS idx_extornos_documentos_adjuntos ON extornos USING GIN (documentos_adjuntos);
CREATE INDEX IF NOT EXISTS idx_extornos_documentos_tramitacion ON extornos USING GIN (documentos_tramitacion);

-- Verificar que los campos se añadieron correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'extornos' 
AND column_name IN ('documentos_adjuntos', 'documentos_tramitacion');
