-- =====================================================
-- SCRIPT COMPLETO PARA ARREGLAR PESTAÑAS PROBLEMÁTICAS
-- =====================================================
-- Descripción: Ejecutar todo el proceso para arreglar las pestañas
-- =====================================================

-- PASO 1: VERIFICAR ESTADO ACTUAL
SELECT 'PASO 1: VERIFICANDO ESTADO ACTUAL' as paso;

-- Verificar si las tablas existen
SELECT 
    'TABLAS EXISTENTES' as info,
    table_name,
    CASE 
        WHEN table_name IN ('vehicle_sale_status', 'sales_vehicles', 'entregas') 
        THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as estado
FROM information_schema.tables 
WHERE table_name IN ('vehicle_sale_status', 'sales_vehicles', 'entregas');

-- PASO 2: CREAR TABLAS FALTANTES
SELECT 'PASO 2: CREANDO TABLAS FALTANTES' as paso;

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

-- PASO 3: CONFIGURAR TRIGGERS Y RLS
SELECT 'PASO 3: CONFIGURANDO TRIGGERS Y RLS' as paso;

-- Función para mantener updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a las nuevas tablas
DROP TRIGGER IF EXISTS update_vehicle_sale_status_updated_at ON vehicle_sale_status;
CREATE TRIGGER update_vehicle_sale_status_updated_at 
    BEFORE UPDATE ON vehicle_sale_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_vehicles_updated_at ON sales_vehicles;
CREATE TRIGGER update_sales_vehicles_updated_at 
    BEFORE UPDATE ON sales_vehicles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entregas_updated_at ON entregas;
CREATE TRIGGER update_entregas_updated_at 
    BEFORE UPDATE ON entregas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS para las nuevas tablas
ALTER TABLE vehicle_sale_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vehicle_sale_status;
CREATE POLICY "Enable read access for authenticated users" ON vehicle_sale_status
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sales_vehicles;
CREATE POLICY "Enable read access for authenticated users" ON sales_vehicles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON entregas;
CREATE POLICY "Enable read access for authenticated users" ON entregas
    FOR SELECT TO authenticated USING (true);

-- PASO 4: INSERTAR DATOS DE PRUEBA
SELECT 'PASO 4: INSERTANDO DATOS DE PRUEBA' as paso;

-- Datos de prueba para vehicle_sale_status
INSERT INTO vehicle_sale_status (vehicle_id, source_table, license_plate, sale_status)
VALUES 
    (gen_random_uuid(), 'stock', 'TEST001', 'profesional'),
    (gen_random_uuid(), 'stock', 'TEST002', 'tactico_vn')
ON CONFLICT DO NOTHING;

-- Datos de prueba para sales_vehicles
INSERT INTO sales_vehicles (license_plate, sold_before_body_ready, sold_before_photos_ready)
VALUES 
    ('TEST001', true, false),
    ('TEST002', false, true)
ON CONFLICT DO NOTHING;

-- Datos de prueba para entregas
INSERT INTO entregas (matricula, modelo, tipo_vehiculo, marca, asesor)
VALUES 
    ('TEST001', 'X1', 'Coche', 'BMW', 'Asesor 1'),
    ('TEST002', 'Serie 3', 'Coche', 'BMW', 'Asesor 2')
ON CONFLICT DO NOTHING;

-- PASO 5: VERIFICAR RESULTADO FINAL
SELECT 'PASO 5: VERIFICANDO RESULTADO FINAL' as paso;

-- Verificar que las tablas se crearon correctamente
SELECT 
    'TABLAS CREADAS' as info,
    table_name,
    'CREADA' as estado
FROM information_schema.tables 
WHERE table_name IN ('vehicle_sale_status', 'sales_vehicles', 'entregas');

-- Verificar datos en las tablas
SELECT 
    'DATOS EN TABLAS' as info,
    'vehicle_sale_status' as tabla,
    COUNT(*) as registros
FROM vehicle_sale_status
UNION ALL
SELECT 
    'DATOS EN TABLAS' as info,
    'sales_vehicles' as tabla,
    COUNT(*) as registros
FROM sales_vehicles
UNION ALL
SELECT 
    'DATOS EN TABLAS' as info,
    'entregas' as tabla,
    COUNT(*) as registros
FROM entregas;

-- Verificar políticas RLS
SELECT 
    'POLÍTICAS RLS' as info,
    tablename,
    policyname,
    'ACTIVA' as estado
FROM pg_policies 
WHERE tablename IN ('vehicle_sale_status', 'sales_vehicles', 'entregas');

-- RESUMEN FINAL
SELECT 
    'RESUMEN FINAL' as tipo,
    'PESTAÑAS ARREGLADAS' as categoria,
    '3 pestañas (profesionales, premature_sales, entregados)' as detalle; 