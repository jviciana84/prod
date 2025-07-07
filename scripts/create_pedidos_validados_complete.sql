-- Crear la tabla pedidos_validados con TODOS los campos de sales_vehicles
CREATE TABLE IF NOT EXISTS public.pedidos_validados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Referencia al vehículo original
  vehicle_id UUID,
  
  -- Datos básicos del vehículo
  license_plate VARCHAR(20) NOT NULL,
  model VARCHAR(100) NOT NULL,
  vehicle_type VARCHAR(50) DEFAULT 'Coche',
  price DECIMAL(10, 2) DEFAULT 0,
  
  -- Datos del asesor
  advisor VARCHAR(100),
  advisor_name VARCHAR(100),
  advisor_id UUID,
  
  -- Datos de pago
  payment_method VARCHAR(50) DEFAULT 'Contado',
  payment_status VARCHAR(50) DEFAULT 'pendiente',
  
  -- Datos del documento
  document_type VARCHAR(10) DEFAULT 'DNI',
  document_number VARCHAR(20),
  
  -- Estados de proceso
  cyp_status VARCHAR(20) DEFAULT 'pendiente',
  cyp_date TIMESTAMP WITH TIME ZONE,
  photo_360_status VARCHAR(20) DEFAULT 'pendiente',
  photo_360_date TIMESTAMP WITH TIME ZONE,
  
  -- Datos de entrega
  delivery_center VARCHAR(50),
  external_provider VARCHAR(100),
  
  -- Campos OR y gastos
  or_value VARCHAR(20) DEFAULT 'ORT',
  expense_charge VARCHAR(100),
  
  -- Datos del cliente (del PDF)
  client_name VARCHAR(200),
  client_email VARCHAR(100),
  client_phone VARCHAR(20),
  client_address TEXT,
  client_city VARCHAR(100),
  client_province VARCHAR(100),
  client_postal_code VARCHAR(10),
  
  -- Datos del vehículo (del PDF)
  vin VARCHAR(50),
  document_id VARCHAR(50),
  
  -- Datos del pedido (del PDF)
  order_number VARCHAR(50),
  order_date DATE,
  bank VARCHAR(100),
  discount VARCHAR(50),
  portal_origin VARCHAR(100),
  is_resale BOOLEAN DEFAULT false,
  
  -- Datos de validación
  status VARCHAR(50) NOT NULL DEFAULT 'Validado',
  validated BOOLEAN DEFAULT true,
  validation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Datos de peritación
  appraised BOOLEAN DEFAULT false,
  appraisal_date TIMESTAMP WITH TIME ZONE,
  
  -- Datos del PDF
  pdf_extraction_id UUID,
  
  -- Observaciones
  observations TEXT,
  
  -- Fechas de control
  sale_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_vehicle_id ON pedidos_validados(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_license_plate ON pedidos_validados(license_plate);
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_validation_date ON pedidos_validados(validation_date);
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_advisor_id ON pedidos_validados(advisor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_payment_status ON pedidos_validados(payment_status);
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_cyp_status ON pedidos_validados(cyp_status);
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_photo_360_status ON pedidos_validados(photo_360_status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE pedidos_validados ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones
DROP POLICY IF EXISTS "pedidos_validados_policy" ON pedidos_validados;
CREATE POLICY "pedidos_validados_policy" ON pedidos_validados FOR ALL USING (true);

-- Comentarios para documentar la tabla
COMMENT ON TABLE pedidos_validados IS 'Tabla que almacena TODOS los datos de los vehículos validados desde sales_vehicles';
COMMENT ON COLUMN pedidos_validados.vehicle_id IS 'Referencia al vehículo en sales_vehicles';
COMMENT ON COLUMN pedidos_validados.validation_date IS 'Fecha y hora cuando se validó el vehículo';
COMMENT ON COLUMN pedidos_validados.pdf_extraction_id IS 'Referencia a los datos extraídos del PDF';
