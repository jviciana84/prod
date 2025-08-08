-- SCRIPT: Trigger para notificaciones automáticas de vehículos certificados
-- ======================================================================

-- PASO 1: Crear función para enviar notificación automática
CREATE OR REPLACE FUNCTION handle_vehicle_certified_notification()
RETURNS TRIGGER AS $$
DECLARE
    asesor_profile RECORD;
    notification_data JSONB;
BEGIN
    -- Buscar el perfil del asesor
    SELECT id, full_name, alias INTO asesor_profile
    FROM profiles 
    WHERE full_name ILIKE NEW.asesor 
       OR alias ILIKE NEW.asesor
    LIMIT 1;
    
    -- Si no se encuentra el asesor, no enviar notificación
    IF asesor_profile.id IS NULL THEN
        RAISE NOTICE '⚠️ Asesor no encontrado para notificación: %', NEW.asesor;
        RETURN NEW;
    END IF;
    
    -- Preparar datos de la notificación
    notification_data := jsonb_build_object(
        'license_plate', NEW.matricula,
        'model', NEW.modelo,
        'advisor', NEW.asesor,
        'or_value', NEW."or",
        'certified_at', NEW.created_at
    );
    
    -- Insertar notificación en notification_history
    INSERT INTO notification_history (
        user_id,
        title,
        body,
        data,
        created_at
    ) VALUES (
        asesor_profile.id,
        '🚗 Vehículo Certificado',
        'El vehículo ' || NEW.matricula || ' (' || NEW.modelo || ') ha sido certificado y está listo para entrega',
        notification_data,
        NOW()
    );
    
    RAISE NOTICE '✅ Notificación enviada a asesor % para vehículo %', asesor_profile.full_name, NEW.matricula;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error enviando notificación: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 2: Crear trigger en la tabla entregas
DROP TRIGGER IF EXISTS vehicle_certified_notification_trigger ON entregas;

CREATE TRIGGER vehicle_certified_notification_trigger
    AFTER INSERT ON entregas
    FOR EACH ROW
    EXECUTE FUNCTION handle_vehicle_certified_notification();

-- PASO 3: Verificar que se creó correctamente
SELECT 
    '✅ Trigger de notificación creado' as status,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'entregas'
AND trigger_name = 'vehicle_certified_notification_trigger';

-- PASO 4: Probar con una entrega existente (opcional)
-- INSERT INTO entregas (fecha_venta, matricula, modelo, asesor, "or", observaciones)
-- VALUES (NOW(), 'TEST001', 'BMW X3', 'JordiVi', '12345', 'Prueba de notificación')
-- ON CONFLICT (matricula) DO NOTHING;
