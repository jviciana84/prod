-- Crear la tabla pedidos_validados con los campos REALES de sales_vehicles
CREATE TABLE IF NOT EXISTS public.pedidos_validados (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Referencia al vehículo original
  vehicle_id UUID,
  
  -- Campos exactos de sales_vehicles
  license_plate VARCHAR(20) NOT NULL,
  model VARCHAR(255) NOT NULL,
  vehicle_type VARCHAR(50),
  stock_id UUID,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  advisor VARCHAR(255) NOT NULL,
  price DECIMAL(12,2),
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pendiente'::character varying,
  or_value VARCHAR(50),
  expense_charge VARCHAR(50),
  cyp_status VARCHAR(50) DEFAULT 'pendiente'::character varying,
  cyp_date TIMESTAMP WITH TIME ZONE,
  photo_360_status VARCHAR(50) DEFAULT 'pendiente'::character varying,
  photo_360_date TIMESTAMP WITH TIME ZONE,
  validated BOOLEAN DEFAULT true, -- Siempre true en pedidos_validados
  validation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  appraised BOOLEAN DEFAULT false,
  appraisal_date TIMESTAMP WITH TIME ZONE,
  delivery_center VARCHAR(100),
  external_provider VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  advisor_name VARCHAR(255),
  advisor_id UUID,
  document_type VARCHAR(10),
  client_name VARCHAR(255),
  client_dni VARCHAR(20),
  client_address TEXT,
  client_phone VARCHAR(20),
  client_email VARCHAR(100),
  vin VARCHAR(50),
  brand VARCHAR(100),
  color VARCHAR(50),
  registration_date DATE,
  mileage INTEGER,
  bank VARCHAR(100),
  origin_portal VARCHAR(100),
  purchase_price DECIMAL(10,2),
  pdf_extraction_id UUID,
  pdf_url TEXT,
  extraction_date TIMESTAMP WITH TIME ZONE,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_reference_id UUID,
  is_resale BOOLEAN DEFAULT false,
  
  -- Campo adicional para estado
  status VARCHAR(50) NOT NULL DEFAULT 'Validado',
  
  -- Observaciones adicionales
  observations TEXT,
  
  PRIMARY KEY (id)
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
COMMENT ON COLUMN pedidos_validados.status IS 'Estado del pedido validado';
