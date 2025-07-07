-- Verificar si la tabla extornos existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'extornos') THEN
        -- Crear la tabla extornos si no existe
        CREATE TABLE extornos (
            id SERIAL PRIMARY KEY,
            matricula VARCHAR(20) NOT NULL,
            cliente TEXT NOT NULL,
            numero_cliente VARCHAR(50),
            concepto TEXT NOT NULL,
            importe DECIMAL(10,2) NOT NULL,
            numero_cuenta VARCHAR(50) NOT NULL,
            concesion INTEGER NOT NULL CHECK (concesion IN (1, 2)),
            estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'tramitado', 'realizado')),
            fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            fecha_tramitacion TIMESTAMP WITH TIME ZONE,
            fecha_realizacion TIMESTAMP WITH TIME ZONE,
            solicitado_por UUID REFERENCES auth.users(id),
            tramitado_por UUID REFERENCES auth.users(id),
            realizado_por UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Crear índices
        CREATE INDEX idx_extornos_matricula ON extornos(matricula);
        CREATE INDEX idx_extornos_estado ON extornos(estado);
        CREATE INDEX idx_extornos_solicitado_por ON extornos(solicitado_por);
        CREATE INDEX idx_extornos_fecha_solicitud ON extornos(fecha_solicitud);

        -- Crear trigger para updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_extornos_updated_at 
            BEFORE UPDATE ON extornos 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Tabla extornos creada exitosamente';
    ELSE
        RAISE NOTICE 'La tabla extornos ya existe';
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE extornos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Usuarios pueden ver todos los extornos" ON extornos;
DROP POLICY IF EXISTS "Usuarios pueden crear extornos" ON extornos;
DROP POLICY IF EXISTS "Usuarios pueden actualizar extornos" ON extornos;

-- Crear políticas RLS más permisivas para debug
CREATE POLICY "Usuarios pueden ver todos los extornos" ON extornos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden crear extornos" ON extornos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden actualizar extornos" ON extornos
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Verificar la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'extornos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar las políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'extornos';

-- Insertar datos de prueba si la tabla está vacía
INSERT INTO extornos (matricula, cliente, concepto, importe, numero_cuenta, concesion, solicitado_por)
SELECT 
    'TEST123',
    'Cliente de Prueba',
    'Extorno de prueba para verificar funcionamiento',
    1500.00,
    'ES12 3456 7890 1234 5678 9012',
    1,
    auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM extornos LIMIT 1)
AND auth.uid() IS NOT NULL;

-- Mostrar el contenido actual de la tabla
SELECT COUNT(*) as total_extornos FROM extornos;
SELECT * FROM extornos ORDER BY created_at DESC LIMIT 5;
