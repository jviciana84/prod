-- =====================================================
-- CREAR TABLAS FALTANTES PARA PESTAÑAS PROBLEMÁTICAS
-- =====================================================
-- Descripción: Crear las tablas que faltan para que funcionen las pestañas
-- =====================================================

-- 1. TABLA vehicle_sale_status (para pestaña "profesionales")
CREATE TABLE IF NOT EXISTS vehicle_sale_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    source_table TEXT NOT NULL, -- 'stock', 'fotos', etc.
    license_plate TEXT NOT NULL,
    sale_status TEXT NOT NULL CHECK (sale_status IN ('profesional', 'tactico_vn', 'retail')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para vehicle_sale_status
CREATE INDEX IF NOT EXISTS idx_vehicle_sale_status_license_plate ON vehicle_sale_status(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_sale_status_sale_status ON vehicle_sale_status(sale_status);

-- 2. TABLA sales_vehicles (para pestaña "premature_sales")
CREATE TABLE IF NOT EXISTS sales_vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_plate TEXT NOT NULL,
    sold_before_body_ready BOOLEAN DEFAULT FALSE,
    sold_before_photos_ready BOOLEAN DEFAULT FALSE,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sales_vehicles
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_license_plate ON sales_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_sales_vehicles_premature ON sales_vehicles(sold_before_body_ready, sold_before_photos_ready);

-- 3. TABLA entregas (para pestaña "entregados")
CREATE TABLE IF NOT EXISTS entregas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    matricula TEXT NOT NULL,
    modelo TEXT,
    tipo_vehiculo TEXT,
    marca TEXT,
    fecha_entrega TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    asesor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para entregas
CREATE INDEX IF NOT EXISTS idx_entregas_matricula ON entregas(matricula);
CREATE INDEX IF NOT EXISTS idx_entregas_fecha_entrega ON entregas(fecha_entrega);

-- 4. TRIGGERS para mantener updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a las nuevas tablas
CREATE TRIGGER update_vehicle_sale_status_updated_at 
    BEFORE UPDATE ON vehicle_sale_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_vehicles_updated_at 
    BEFORE UPDATE ON sales_vehicles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entregas_updated_at 
    BEFORE UPDATE ON entregas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS para las nuevas tablas
ALTER TABLE vehicle_sale_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
CREATE POLICY "Enable read access for authenticated users" ON vehicle_sale_status
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON sales_vehicles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON entregas
    FOR SELECT TO authenticated USING (true);

-- 6. DATOS DE PRUEBA (opcional)
-- INSERT INTO vehicle_sale_status (vehicle_id, source_table, license_plate, sale_status)
-- VALUES 
--     (gen_random_uuid(), 'stock', 'TEST001', 'profesional'),
--     (gen_random_uuid(), 'stock', 'TEST002', 'tactico_vn');

-- INSERT INTO sales_vehicles (license_plate, sold_before_body_ready, sold_before_photos_ready)
-- VALUES 
--     ('TEST001', true, false),
--     ('TEST002', false, true);

-- INSERT INTO entregas (matricula, modelo, tipo_vehiculo, marca, asesor)
-- VALUES 
--     ('TEST001', 'X1', 'Coche', 'BMW', 'Asesor 1'),
--     ('TEST002', 'Serie 3', 'Coche', 'BMW', 'Asesor 2'); 