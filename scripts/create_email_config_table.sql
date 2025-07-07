-- Crear tabla de configuración de email si no existe
CREATE TABLE IF NOT EXISTS email_config (
  id SERIAL PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  sender_email VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  cc_emails TEXT[] DEFAULT '{}',
  subject_template TEXT DEFAULT 'Movimiento de llaves - {fecha}',
  body_template TEXT DEFAULT 'Se ha registrado un movimiento de llaves el {fecha}:

{materiales}

Usuario que entrega: {usuario_entrega}
Usuario que recibe: {usuario_recibe}

Este es un mensaje automático del sistema de gestión de llaves.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración por defecto si no existe
INSERT INTO email_config (
  enabled,
  sender_email,
  sender_name,
  subject_template,
  body_template
) 
SELECT 
  true,
  'noreply@bmwviciana.com',
  'Sistema BMW Viciana',
  'Movimiento de llaves - {fecha}',
  'Se ha registrado un movimiento de llaves el {fecha}:

{materiales}

Usuario que entrega: {usuario_entrega}
Usuario que recibe: {usuario_recibe}

Este es un mensaje automático del sistema de gestión de llaves.'
WHERE NOT EXISTS (SELECT 1 FROM email_config);

-- Habilitar RLS
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan ver/editar
CREATE POLICY "Admin can manage email config" ON email_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'administrador')
    )
  );

-- Verificar que se creó correctamente
SELECT * FROM email_config;
