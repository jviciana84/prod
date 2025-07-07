-- Crear tabla para almacenar las extracciones de PDF
CREATE TABLE IF NOT EXISTS pdf_extractions (
  id SERIAL PRIMARY KEY,
  
  -- Campos extraídos del PDF
  banco TEXT,
  comercial TEXT,
  total TEXT,
  matricula TEXT,
  provincia TEXT,
  codigo_postal TEXT,
  ciudad TEXT,
  email TEXT,
  telefono TEXT,
  dni_nif TEXT,
  domicilio TEXT,
  portal_origen TEXT,
  nombre_empresa TEXT,
  fecha_pedido TEXT,
  bastidor TEXT,
  modelo TEXT,
  descuento TEXT,
  numero_pedido TEXT,
  
  -- Metadatos
  archivo_original TEXT,
  metodo_extraccion TEXT,
  texto_completo TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  fecha_extraccion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pdf_extractions_usuario_id ON pdf_extractions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pdf_extractions_fecha_extraccion ON pdf_extractions(fecha_extraccion);
CREATE INDEX IF NOT EXISTS idx_pdf_extractions_numero_pedido ON pdf_extractions(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pdf_extractions_matricula ON pdf_extractions(matricula);

-- Habilitar RLS (Row Level Security)
ALTER TABLE pdf_extractions ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias extracciones
CREATE POLICY "Users can view own extractions" ON pdf_extractions
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política para que los usuarios puedan insertar sus propias extracciones
CREATE POLICY "Users can insert own extractions" ON pdf_extractions
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política para que los usuarios puedan actualizar sus propias extracciones
CREATE POLICY "Users can update own extractions" ON pdf_extractions
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política para que los usuarios puedan eliminar sus propias extracciones
CREATE POLICY "Users can delete own extractions" ON pdf_extractions
  FOR DELETE USING (auth.uid() = usuario_id);
