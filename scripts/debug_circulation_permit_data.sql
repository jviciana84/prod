-- Script para verificar y crear datos de prueba en circulation_permit_requests

-- 1. Verificar si las tablas existen
SELECT 
    table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = table_name
    ) as exists
FROM (VALUES 
    ('circulation_permit_requests'),
    ('circulation_permit_materials')
) as tables(table_name);

-- 2. Verificar si hay datos en circulation_permit_requests
SELECT 
    'circulation_permit_requests' as table_name,
    COUNT(*) as total_records
FROM circulation_permit_requests
UNION ALL
SELECT 
    'circulation_permit_materials' as table_name,
    COUNT(*) as total_records
FROM circulation_permit_materials;

-- 3. Mostrar las primeras 5 solicitudes si existen
SELECT 
    id,
    license_plate,
    model,
    asesor_alias,
    request_date,
    status
FROM circulation_permit_requests
ORDER BY request_date DESC
LIMIT 5;

-- 4. Mostrar materiales de las primeras solicitudes
SELECT 
    cpm.id,
    cpm.circulation_permit_request_id,
    cpm.material_type,
    cpm.material_label,
    cpm.selected,
    cpr.license_plate
FROM circulation_permit_materials cpm
JOIN circulation_permit_requests cpr ON cpm.circulation_permit_request_id = cpr.id
ORDER BY cpr.request_date DESC
LIMIT 10;

-- 5. Verificar entregas con fecha_entrega para crear datos de prueba
SELECT 
    id,
    matricula,
    modelo,
    asesor,
    fecha_entrega
FROM entregas
WHERE fecha_entrega IS NOT NULL
AND asesor IS NOT NULL
AND asesor != ''
ORDER BY fecha_entrega DESC
LIMIT 5;

-- 6. Crear datos de prueba si no hay solicitudes (descomenta si es necesario)
/*
-- Insertar solicitudes de prueba basadas en entregas existentes
INSERT INTO circulation_permit_requests (
    entrega_id,
    license_plate,
    model,
    asesor_alias,
    request_date,
    status,
    observations
)
SELECT 
    id as entrega_id,
    matricula as license_plate,
    modelo as model,
    asesor as asesor_alias,
    fecha_entrega as request_date,
    'pending' as status,
    'Solicitud de prueba' as observations
FROM entregas
WHERE fecha_entrega IS NOT NULL
AND asesor IS NOT NULL
AND asesor != ''
AND id NOT IN (
    SELECT entrega_id 
    FROM circulation_permit_requests 
    WHERE entrega_id IS NOT NULL
)
LIMIT 10;

-- Insertar materiales para las solicitudes creadas
INSERT INTO circulation_permit_materials (
    circulation_permit_request_id,
    material_type,
    material_label,
    selected,
    observations
)
SELECT 
    cpr.id as circulation_permit_request_id,
    'circulation_permit' as material_type,
    'Permiso de Circulación' as material_label,
    false as selected,
    '' as observations
FROM circulation_permit_requests cpr
WHERE cpr.id NOT IN (
    SELECT circulation_permit_request_id 
    FROM circulation_permit_materials
);
*/ 