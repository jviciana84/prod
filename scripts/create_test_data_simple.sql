-- Script simple para crear datos de prueba en circulation_permit_requests

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
    ('test-1', '1234ABC', 'BMW X3', 'JordiVi', NOW() - INTERVAL '2 days', 'pending', 'Solicitud de prueba 1'),
    ('test-2', '5678DEF', 'BMW X5', 'JordiVi', NOW() - INTERVAL '1 day', 'pending', 'Solicitud de prueba 2'),
    ('test-3', '9012GHI', 'BMW 320i', 'JordiVi', NOW(), 'pending', 'Solicitud de prueba 3'),
    ('test-4', '3456JKL', 'BMW 520d', 'JordiVi', NOW() - INTERVAL '3 days', 'pending', 'Solicitud de prueba 4'),
    ('test-5', '7890MNO', 'BMW X1', 'JordiVi', NOW() - INTERVAL '4 days', 'pending', 'Solicitud de prueba 5')
ON CONFLICT DO NOTHING;

-- Crear materiales para las solicitudes
INSERT INTO circulation_permit_materials (
    circulation_permit_request_id,
    material_type,
    material_label,
    selected,
    observations
)
SELECT 
    cpr.id,
    'circulation_permit',
    'Permiso de Circulación',
    false,
    ''
FROM circulation_permit_requests cpr
WHERE cpr.entrega_id IN ('test-1', 'test-2', 'test-3', 'test-4', 'test-5')
ON CONFLICT DO NOTHING;

-- Verificar que se crearon los datos
SELECT 
    'RESULTADO' as info,
    (SELECT COUNT(*) FROM circulation_permit_requests) as solicitudes,
    (SELECT COUNT(*) FROM circulation_permit_materials) as materiales; 