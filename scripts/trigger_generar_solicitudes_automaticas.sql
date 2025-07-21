-- TRIGGER PARA GENERAR SOLICITUDES AUTOMÁTICAS DESDE VENTAS
-- Se ejecuta automáticamente cuando se inserta una nueva venta en sales_vehicles

-- Función que se ejecutará cuando se inserte una nueva venta
CREATE OR REPLACE FUNCTION generar_solicitud_key_document()
RETURNS TRIGGER AS $$
DECLARE
    solicitud_id UUID;
    material_id UUID;
    asesor_profile RECORD;
BEGIN
    -- Obtener información del asesor
    SELECT id, full_name, alias INTO asesor_profile
    FROM profiles 
    WHERE id = NEW.advisor_id;
    
    -- Crear la solicitud principal
    INSERT INTO key_document_requests (
        license_plate,
        requester,
        request_date,
        status,
        observations,
        receiver_alias,
        created_at,
        updated_at,
        email_subject,
        email_body
    ) VALUES (
        NEW.license_plate,
        COALESCE(asesor_profile.full_name, asesor_profile.alias, 'Asesor'),
        NEW.created_at::DATE,
        'pending',
        '',
        COALESCE(asesor_profile.full_name, asesor_profile.alias, 'asesor'),
        NOW(),
        NOW(),
        'Solicitud automática desde venta',
        'Generada automáticamente al registrar la venta'
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
        'Generado automáticamente desde venta',
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
        'Generado automáticamente desde venta',
        NOW()
    );
    
    -- Log de la operación
    RAISE NOTICE 'Solicitud automática creada para vehículo % con ID %', NEW.license_plate, solicitud_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_generar_solicitud_key_document ON sales_vehicles;

CREATE TRIGGER trigger_generar_solicitud_key_document
    AFTER INSERT ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION generar_solicitud_key_document();

-- Verificar que el trigger se creó correctamente
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_generar_solicitud_key_document';

-- Mensaje de confirmación
SELECT 'TRIGGER CREADO CORRECTAMENTE - Las ventas generarán solicitudes automáticamente' as estado; 