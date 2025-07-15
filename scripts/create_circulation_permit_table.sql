-- Crear tabla para solicitudes de Permiso de Circulación
CREATE TABLE IF NOT EXISTS circulation_permit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrega_id UUID REFERENCES entregas(id) ON DELETE CASCADE,
    license_plate VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    asesor_alias VARCHAR(100) NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para materiales de cada solicitud de permiso
CREATE TABLE IF NOT EXISTS circulation_permit_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circulation_permit_request_id UUID REFERENCES circulation_permit_requests(id) ON DELETE CASCADE,
    material_type VARCHAR(50) NOT NULL DEFAULT 'circulation_permit',
    material_label VARCHAR(100) NOT NULL DEFAULT 'Permiso de Circulación',
    selected BOOLEAN DEFAULT false,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_circulation_permit_requests_status ON circulation_permit_requests(status);
CREATE INDEX IF NOT EXISTS idx_circulation_permit_requests_license_plate ON circulation_permit_requests(license_plate);
CREATE INDEX IF NOT EXISTS idx_circulation_permit_requests_asesor ON circulation_permit_requests(asesor_alias);
CREATE INDEX IF NOT EXISTS idx_circulation_permit_requests_date ON circulation_permit_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_circulation_permit_materials_request_id ON circulation_permit_materials(circulation_permit_request_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_circulation_permit_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_circulation_permit_requests_updated_at_trigger ON circulation_permit_requests;
CREATE TRIGGER update_circulation_permit_requests_updated_at_trigger
    BEFORE UPDATE ON circulation_permit_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_circulation_permit_requests_updated_at();

-- Habilitar RLS
ALTER TABLE circulation_permit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE circulation_permit_materials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
CREATE POLICY "Allow all operations on circulation_permit_requests" ON circulation_permit_requests
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on circulation_permit_materials" ON circulation_permit_materials
    FOR ALL USING (true) WITH CHECK (true);

-- Comentarios para documentar
COMMENT ON TABLE circulation_permit_requests IS 'Tabla para gestionar solicitudes de permiso de circulación desde entregas';
COMMENT ON TABLE circulation_permit_materials IS 'Tabla para gestionar materiales de solicitudes de permiso de circulación'; 