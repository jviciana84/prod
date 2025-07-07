-- Crear la tabla pedidos_validados si no existe
CREATE TABLE IF NOT EXISTS public.pedidos_validados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES sales_vehicles(id),
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

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_vehicle_id ON pedidos_validados(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_license_plate ON pedidos_validados(license_plate);
CREATE INDEX IF NOT EXISTS idx_pedidos_validados_validation_date ON pedidos_validados(validation_date);

-- Habilitar RLS (Row Level Security)
ALTER TABLE pedidos_validados ENABLE ROW LEVEL SECURITY;

-- Eliminar política existente si existe y crear nueva
DROP POLICY IF EXISTS "Allow all operations on pedidos_validados" ON pedidos_validados;
CREATE POLICY "Allow all operations on pedidos_validados" ON pedidos_validados
  FOR ALL USING (true) WITH CHECK (true);

-- Comentarios para documentar la tabla
COMMENT ON TABLE pedidos_validados IS 'Tabla que almacena los vehículos que han sido validados desde sales_vehicles';
COMMENT ON COLUMN pedidos_validados.vehicle_id IS 'Referencia al vehículo en sales_vehicles';
COMMENT ON COLUMN pedidos_validados.validation_date IS 'Fecha y hora cuando se validó el vehículo';
