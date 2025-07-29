-- =====================================================
-- AÑADIR TABLA PARA ESTADOS DE VENTA DE VEHÍCULOS
-- =====================================================

-- Crear tabla para almacenar estados de venta
CREATE TABLE IF NOT EXISTS vehicle_sale_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    source_table TEXT NOT NULL, -- 'stock' o 'nuevas_entradas'
    license_plate TEXT NOT NULL,
    sale_status TEXT NOT NULL CHECK (sale_status IN ('profesional', 'vendido', 'tactico_vn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- ID del usuario que marcó el estado
    notes TEXT
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_vehicle_sale_status_license_plate ON vehicle_sale_status(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_sale_status_sale_status ON vehicle_sale_status(sale_status);
CREATE INDEX IF NOT EXISTS idx_vehicle_sale_status_created_at ON vehicle_sale_status(created_at);

-- Comentarios para documentar la tabla
COMMENT ON TABLE vehicle_sale_status IS 'Tabla para almacenar estados de venta de vehículos ausentes del CSV';
COMMENT ON COLUMN vehicle_sale_status.sale_status IS 'Estado de venta: profesional, vendido, tactico_vn';
COMMENT ON COLUMN vehicle_sale_status.source_table IS 'Tabla de origen: stock o nuevas_entradas'; 