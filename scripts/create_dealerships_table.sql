-- Crear tabla de concesionarios si no existe
CREATE TABLE IF NOT EXISTS dealerships (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    cif VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar los concesionarios conocidos
INSERT INTO dealerships (code, name, cif, address, city, phone, active) 
VALUES 
    ('MM', 'Motormadrid', 'A58800111', 'C/ Costa i Deu, 133 - 08205 Sabadell', 'Sabadell', '902 36 60 87', true),
    ('MMC', 'Motormadrid Concesionario', 'B67276543', 'Dirección MMC', 'Ciudad MMC', '902 36 60 87', true)
ON CONFLICT (cif) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- Verificar los datos insertados
SELECT * FROM dealerships ORDER BY code;

-- Habilitar RLS si no está habilitado
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura a todos los usuarios autenticados
CREATE POLICY IF NOT EXISTS "Allow read access to dealerships" ON dealerships
    FOR SELECT USING (auth.role() = 'authenticated');

-- Crear política para permitir escritura solo a administradores
CREATE POLICY IF NOT EXISTS "Allow admin write access to dealerships" ON dealerships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()::text
            AND r.name IN ('Administrador', 'Super Admin')
        )
    );
