-- Crear tabla para solicitudes Docuware
CREATE TABLE IF NOT EXISTS docuware_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    requester VARCHAR(100) NOT NULL,
    request_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para materiales de cada solicitud
CREATE TABLE IF NOT EXISTS docuware_request_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docuware_request_id UUID REFERENCES docuware_requests(id) ON DELETE CASCADE,
    material_type VARCHAR(50) NOT NULL,
    material_label VARCHAR(100) NOT NULL,
    selected BOOLEAN DEFAULT true,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_docuware_requests_status ON docuware_requests(status);
CREATE INDEX IF NOT EXISTS idx_docuware_requests_license_plate ON docuware_requests(license_plate);
CREATE INDEX IF NOT EXISTS idx_docuware_requests_date ON docuware_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_docuware_request_materials_request_id ON docuware_request_materials(docuware_request_id);
CREATE INDEX IF NOT EXISTS idx_docuware_request_materials_type ON docuware_request_materials(material_type);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_docuware_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_docuware_requests_updated_at
    BEFORE UPDATE ON docuware_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_docuware_requests_updated_at();

-- Insertar datos de ejemplo
INSERT INTO docuware_requests (
    email_subject,
    email_body,
    license_plate,
    requester,
    request_date,
    status,
    observations
) VALUES 
(
    'Nuevo pedido 8745MBS || 11/1/2024 || GABRIEL CAMPOS HORACIO || JORDIVI',
    'Hola,

Sol·licita si us plau clau i fitxa tècnica del vehicle 8745MBS.

Gràcies!',
    '8745MBS',
    'JORDIVI',
    '2024-01-11',
    'pending',
    ''
),
(
    'Nuevo pedido 1234ABC || 12/1/2024 || MARÍA GARCÍA || TALLER',
    'Hola,

Sol·licita si us plau clau i fitxa tècnica del vehicle 1234ABC.

Gràcies!',
    '1234ABC',
    'TALLER',
    '2024-01-12',
    'pending',
    ''
);

-- Insertar materiales para las solicitudes de ejemplo
INSERT INTO docuware_request_materials (
    docuware_request_id,
    material_type,
    material_label,
    selected,
    observations
) 
SELECT 
    dr.id,
    'second_key',
    '2ª Llave',
    true,
    ''
FROM docuware_requests dr
WHERE dr.license_plate = '8745MBS'
UNION ALL
SELECT 
    dr.id,
    'technical_sheet',
    'Ficha Técnica',
    true,
    ''
FROM docuware_requests dr
WHERE dr.license_plate = '8745MBS'
UNION ALL
SELECT 
    dr.id,
    'second_key',
    '2ª Llave',
    true,
    ''
FROM docuware_requests dr
WHERE dr.license_plate = '1234ABC'
UNION ALL
SELECT 
    dr.id,
    'technical_sheet',
    'Ficha Técnica',
    true,
    ''
FROM docuware_requests dr
WHERE dr.license_plate = '1234ABC';

-- Verificar que se creó correctamente
SELECT 
    dr.license_plate,
    dr.requester,
    dr.status,
    COUNT(drm.material_type) as materials_count
FROM docuware_requests dr
LEFT JOIN docuware_request_materials drm ON dr.id = drm.docuware_request_id
GROUP BY dr.id, dr.license_plate, dr.requester, dr.status
ORDER BY dr.created_at DESC; 