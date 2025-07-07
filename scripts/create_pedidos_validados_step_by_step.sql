-- Primero eliminar la tabla si existe
DROP TABLE IF EXISTS public.pedidos_validados CASCADE;

-- Crear la tabla pedidos_validados SIN el campo payment_status problemático
CREATE TABLE public.pedidos_validados (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Referencia al vehículo original
  vehicle_id UUID,
  
  -- Campos básicos
  license_plate VARCHAR(20) NOT NULL,
  model VARCHAR(255) NOT NULL,
  vehicle_type VARCHAR(50),
  stock_id UUID,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  advisor VARCHAR(255) NOT NULL,
  price DECIMAL(12,2),
  payment_method VARCHAR(50) NOT NULL,
  or_value VARCHAR(50),
  expense_charge VARCHAR(50),
  cyp_status VARCHAR(50) DEFAULT 'pendiente',
  cyp_date TIMESTAMP WITH TIME ZONE,
  photo_360_status VARCHAR(50) DEFAULT 'pendiente',
  photo_360_date TIMESTAMP WITH TIME ZONE,
  validated BOOLEAN DEFAULT true,
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
  
  -- Campos adicionales
  status VARCHAR(50) NOT NULL DEFAULT 'Validado',
  observations TEXT,
  
  PRIMARY KEY (id)
);

-- Ahora agregar el campo payment_status por separado
ALTER TABLE pedidos_validados ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pendiente';

-- Crear índices
CREATE INDEX idx_pedidos_validados_vehicle_id ON pedidos_validados(vehicle_id);
CREATE INDEX idx_pedidos_validados_license_plate ON pedidos_validados(license_plate);
CREATE INDEX idx_pedidos_validados_validation_date ON pedidos_validados(validation_date);

-- Habilitar RLS
ALTER TABLE pedidos_validados ENABLE ROW LEVEL SECURITY;

-- Crear política
CREATE POLICY "pedidos_validados_policy" ON pedidos_validados FOR ALL USING (true);
