-- Versión simple sin referencias externas
CREATE TABLE IF NOT EXISTS public.pedidos_validados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID,
  license_plate VARCHAR(20) NOT NULL,
  model VARCHAR(100) NOT NULL,
  vehicle_type VARCHAR(50) DEFAULT 'Coche',
  document_type VARCHAR(10) DEFAULT 'DNI',
  document_number VARCHAR(20),
  client_name VARCHAR(100),
  price DECIMAL(10, 2) DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'Contado',
  status VARCHAR(50) NOT NULL DEFAULT 'Validado',
  validation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  advisor_id UUID,
  advisor_name VARCHAR(100),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_vehicle_id ON pedidos_validados(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_license_plate ON pedidos_validados(license_plate);

-- Habilitar RLS y crear política básica
ALTER TABLE pedidos_validados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pedidos_validados_policy" ON pedidos_validados;
CREATE POLICY "pedidos_validados_policy" ON pedidos_validados FOR ALL USING (true);
