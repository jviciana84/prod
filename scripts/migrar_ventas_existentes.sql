-- SCRIPT PARA MIGRAR VENTAS EXISTENTES A SOLICITUDES
-- Genera solicitudes para todas las ventas que no tengan solicitudes ya creadas

-- Función para generar solicitud para una venta específica
CREATE OR REPLACE FUNCTION generar_solicitud_para_venta(venta_license_plate VARCHAR, venta_advisor_id UUID, venta_created_at TIMESTAMP WITH TIME ZONE)
RETURNS UUID AS $$
DECLARE
    solicitud_id UUID;
    asesor_profile RECORD;
BEGIN
    -- Obtener información del asesor
    SELECT id, full_name, alias INTO asesor_profile
    FROM profiles 
    WHERE id = venta_advisor_id;
    
    -- Verificar si ya existe una solicitud para esta matrícula
    IF EXISTS (SELECT 1 FROM key_document_requests WHERE license_plate = venta_license_plate) THEN
        RAISE NOTICE 'Ya existe solicitud para matrícula %', venta_license_plate;
        RETURN NULL;
    END IF;
    
    -- Crear la solicitud principal
    INSERT INTO key_document_requests (
        license_plate,
        requester,
        request_date,
        status,
        observations,
        receiver_alias,
        created_at,
        updated_at
    ) VALUES (
        venta_license_plate,
        COALESCE(asesor_profile.full_name, asesor_profile.alias, 'Asesor'),
        venta_created_at::DATE,
        'pending',
        'Solicitud migrada desde venta existente',
        COALESCE(asesor_profile.alias, 'asesor'),
        NOW(),
        NOW()
    ) RETURNING id INTO solicitud_id;
    
    -- Crear material: 2ª Llave
    INSERT INTO key_document_materials (
        key_document_request_id,
        material_type,
        material_label,
        selected,
        observations,
        created_at
    ) VALUES (
        solicitud_id,
        'second_key',
        '2ª Llave',
        false,
        'Migrado desde venta existente',
        NOW()
    );
    
    -- Crear material: Ficha Técnica
    INSERT INTO key_document_materials (
        key_document_request_id,
        material_type,
        material_label,
        selected,
        observations,
        created_at
    ) VALUES (
        solicitud_id,
        'technical_sheet',
        'Ficha Técnica',
        false,
        'Migrado desde venta existente',
        NOW()
    );
    
    RAISE NOTICE 'Solicitud creada para venta % con ID %', venta_license_plate, solicitud_id;
    RETURN solicitud_id;
END;
$$ LANGUAGE plpgsql;

-- Procesar todas las ventas que no tengan solicitudes
DO $$
DECLARE
    venta RECORD;
    solicitudes_creadas INTEGER := 0;
    total_ventas INTEGER := 0;
BEGIN
    -- Contar total de ventas
    SELECT COUNT(*) INTO total_ventas FROM sales_vehicles;
    
    -- Procesar cada venta
    FOR venta IN 
        SELECT sv.license_plate, sv.advisor_id, sv.created_at
        FROM sales_vehicles sv
        WHERE NOT EXISTS (
            SELECT 1 FROM key_document_requests kdr 
            WHERE kdr.license_plate = sv.license_plate
        )
        ORDER BY sv.created_at
    LOOP
        IF generar_solicitud_para_venta(venta.license_plate, venta.advisor_id, venta.created_at) IS NOT NULL THEN
            solicitudes_creadas := solicitudes_creadas + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'MIGRACIÓN COMPLETADA: % solicitudes creadas de % ventas totales', solicitudes_creadas, total_ventas;
END $$;

-- Verificar resultado
SELECT 
    'key_document_requests' as tabla,
    COUNT(*) as total_solicitudes
FROM key_document_requests
UNION ALL
SELECT 
    'key_document_materials' as tabla,
    COUNT(*) as total_materiales
FROM key_document_materials
UNION ALL
SELECT 
    'sales_vehicles' as tabla,
    COUNT(*) as total_ventas
FROM sales_vehicles;

-- Mostrar algunas solicitudes creadas como ejemplo
SELECT 
    license_plate,
    requester,
    request_date,
    status,
    created_at
FROM key_document_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- Mensaje final
SELECT 'MIGRACIÓN DE VENTAS EXISTENTES COMPLETADA' as estado; 