-- Script para crear datos de prueba en circulation_permit_requests

-- Limpiar datos existentes (opcional)
-- DELETE FROM circulation_permit_materials;
-- DELETE FROM circulation_permit_requests;

-- Crear solicitudes de prueba
INSERT INTO circulation_permit_requests (
    entrega_id,
    license_plate,
    model,
    asesor_alias,
    request_date,
    status,
    observations
) VALUES 
    ('test-entrega-1', '1234ABC', 'BMW X3', 'JordiVi', NOW() - INTERVAL '2 days', 'pending', 'Solicitud de prueba 1'),
    ('test-entrega-2', '5678DEF', 'BMW X5', 'JordiVi', NOW() - INTERVAL '1 day', 'pending', 'Solicitud de prueba 2'),
    ('test-entrega-3', '9012GHI', 'BMW 320i', 'JordiVi', NOW(), 'pending', 'Solicitud de prueba 3'),
    ('test-entrega-4', '3456JKL', 'BMW 520d', 'JordiVi', NOW() - INTERVAL '3 days', 'pending', 'Solicitud de prueba 4'),
    ('test-entrega-5', '7890MNO', 'BMW X1', 'JordiVi', NOW() - INTERVAL '4 days', 'pending', 'Solicitud de prueba 5')
ON CONFLICT DO NOTHING;

-- Obtener los IDs de las solicitudes creadas
WITH created_requests AS (
    SELECT id FROM circulation_permit_requests 
    WHERE license_plate IN ('1234ABC', '5678DEF', '9012GHI', '3456JKL', '7890MNO')
)
-- Crear materiales para cada solicitud
INSERT INTO circulation_permit_materials (
    circulation_permit_request_id,
    material_type,
    material_label,
    selected,
    observations
)
SELECT 
    cr.id,
    'circulation_permit',
    'Permiso de Circulación',
    false,
    ''
FROM created_requests cr
ON CONFLICT DO NOTHING;

-- Verificar que se crearon los datos
SELECT 
    'Solicitudes creadas:' as info,
    COUNT(*) as count
FROM circulation_permit_requests
WHERE license_plate IN ('1234ABC', '5678DEF', '9012GHI', '3456JKL', '7890MNO')
UNION ALL
SELECT 
    'Materiales creados:' as info,
    COUNT(*) as count
FROM circulation_permit_materials cpm
JOIN circulation_permit_requests cpr ON cpm.circulation_permit_request_id = cpr.id
WHERE cpr.license_plate IN ('1234ABC', '5678DEF', '9012GHI', '3456JKL', '7890MNO'); 