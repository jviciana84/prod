-- SCRIPT: Trigger para notificaciones automáticas de ventas caídas
-- =================================================================

-- PASO 1: Crear función para enviar notificación automática de venta caída
CREATE OR REPLACE FUNCTION handle_failed_sale_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_user RECORD;
    notification_data JSONB;
    admin_users_cursor CURSOR FOR
        SELECT id, full_name, alias, role
        FROM profiles 
        WHERE role ILIKE 'admin' 
           OR role ILIKE 'supervisor' 
           OR role ILIKE 'director';
BEGIN
    -- Solo procesar cuando se marca como venta caída
    IF NEW.is_failed_sale = true AND (OLD.is_failed_sale IS NULL OR OLD.is_failed_sale = false) THEN
        
        -- Preparar datos de la notificación
        notification_data := jsonb_build_object(
            'license_plate', NEW.license_plate,
            'model', NEW.model,
            'advisor', COALESCE(NEW.advisor_name, NEW.advisor),
            'failed_reason', NEW.failed_reason,
            'failed_date', NEW.failed_date
        );
        
        -- Enviar notificación a todos los usuarios admin/supervisor/director
        FOR admin_user IN admin_users_cursor LOOP
            -- Insertar notificación en notification_history
            INSERT INTO notification_history (
                user_id,
                title,
                body,
                data,
                created_at
            ) VALUES (
                admin_user.id,
                '⚠️ Venta Caída',
                'La venta del vehículo ' || NEW.license_plate || ' (' || NEW.model || ') del asesor ' || COALESCE(NEW.advisor_name, NEW.advisor) || ' ha sido marcada como caída',
                notification_data,
                NOW()
            );
            
            RAISE NOTICE '✅ Notificación de venta caída enviada a % (%s) para vehículo %', admin_user.full_name, admin_user.role, NEW.license_plate;
        END LOOP;
        
        RAISE NOTICE '✅ Notificaciones de venta caída enviadas a todos los administradores para vehículo %', NEW.license_plate;
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error enviando notificaciones de venta caída: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 2: Crear trigger en la tabla pedidos_validados
DROP TRIGGER IF EXISTS failed_sale_notification_trigger ON pedidos_validados;

CREATE TRIGGER failed_sale_notification_trigger
    AFTER UPDATE ON pedidos_validados
    FOR EACH ROW
    EXECUTE FUNCTION handle_failed_sale_notification();

-- PASO 3: Verificar que se creó correctamente
SELECT 
    '✅ Trigger de notificación de venta caída creado' as status,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'pedidos_validados'
AND trigger_name = 'failed_sale_notification_trigger';

-- PASO 4: Probar con una actualización de prueba (opcional)
-- UPDATE pedidos_validados 
-- SET is_failed_sale = true, failed_reason = 'Prueba de notificación', failed_date = NOW()
-- WHERE license_plate = 'TEST001'
-- AND is_failed_sale = false;
