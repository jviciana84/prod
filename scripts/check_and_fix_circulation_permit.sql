-- Script para verificar y crear datos de prueba en circulation_permit_requests

-- 1. Verificar si hay datos
SELECT 'circulation_permit_requests' as table_name, COUNT(*) as total FROM circulation_permit_requests
UNION ALL
SELECT 'circulation_permit_materials' as table_name, COUNT(*) as total FROM circulation_permit_materials;

-- 2. Si no hay datos, crear algunos de prueba
DO $$
BEGIN
    -- Solo crear si no hay datos
    IF (SELECT COUNT(*) FROM circulation_permit_requests) = 0 THEN
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
            ('test-3', '9012GHI', 'BMW 320i', 'JordiVi', NOW(), 'pending', 'Solicitud de prueba 3');

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
        WHERE cpr.entrega_id IN ('test-1', 'test-2', 'test-3');

        RAISE NOTICE 'Datos de prueba creados exitosamente';
    ELSE
        RAISE NOTICE 'Ya existen datos en las tablas';
    END IF;
END $$;

-- 3. Verificar el resultado
SELECT 
    'RESULTADO FINAL' as info,
    (SELECT COUNT(*) FROM circulation_permit_requests) as solicitudes,
    (SELECT COUNT(*) FROM circulation_permit_materials) as materiales; 