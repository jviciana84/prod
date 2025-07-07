-- Crear tabla de objetivos de ventas
CREATE TABLE IF NOT EXISTS sales_objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    concesionario TEXT NOT NULL,
    marca TEXT NOT NULL CHECK (marca IN ('BMW', 'MINI')),
    mes TEXT NOT NULL,
    año INTEGER NOT NULL,
    objetivo INTEGER NOT NULL CHECK (objetivo >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados
    UNIQUE(concesionario, marca, mes, año)
);

-- Habilitar RLS
ALTER TABLE sales_objectives ENABLE ROW LEVEL SECURITY;

-- Política para que todos los usuarios autenticados puedan leer
CREATE POLICY "Todos pueden leer objetivos" ON sales_objectives
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para que solo admins puedan insertar/actualizar/eliminar
CREATE POLICY "Solo admins pueden modificar objetivos" ON sales_objectives
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'admin'
        )
    );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_objectives_updated_at
    BEFORE UPDATE ON sales_objectives
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunos datos de ejemplo
INSERT INTO sales_objectives (concesionario, marca, mes, año, objetivo) VALUES
('Motor Munich', 'BMW', 'Diciembre', 2024, 50),
('Motor Munich', 'MINI', 'Diciembre', 2024, 15),
('Motor Munich Cadí', 'BMW', 'Diciembre', 2024, 40),
('Motor Munich Cadí', 'MINI', 'Diciembre', 2024, 10),
('Motor Munich', 'BMW', 'Enero', 2025, 55),
('Motor Munich', 'MINI', 'Enero', 2025, 18),
('Motor Munich Cadí', 'BMW', 'Enero', 2025, 45),
('Motor Munich Cadí', 'MINI', 'Enero', 2025, 12)
ON CONFLICT (concesionario, marca, mes, año) DO NOTHING;
