-- SCRIPT: Trigger para notificaciones automáticas de ventas nuevas
-- =================================================================

-- PASO 1: Crear función para enviar notificación automática de venta nueva
CREATE OR REPLACE FUNCTION handle_new_sale_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_user RECORD;
    notification_data JSONB;
    notification_body TEXT;
    admin_users_cursor CURSOR FOR
        SELECT id, full_name, alias, role
        FROM profiles 
        WHERE role ILIKE 'admin' 
           OR role ILIKE 'supervisor' 
           OR role ILIKE 'director';
BEGIN
    -- Solo procesar cuando se inserta una nueva venta
    IF TG_OP = 'INSERT' THEN
        
        -- Preparar datos de la notificación (usando columnas correctas)
        notification_data := jsonb_build_object(
            'license_plate', NEW.license_plate,
            'model', NEW.model,
            'advisor', NEW.advisor,
            'sale_date', NEW.sale_date,
            'sale_price', NEW.sale_price,
            'discount', NEW.discount,
            'client_name', NEW.client_name
        );
        
        -- Construir el mensaje del cuerpo de la notificación
        notification_body := 'Nueva venta registrada: ' || NEW.license_plate || ' (' || NEW.model || ') por ' || NEW.advisor;
        
        -- Agregar precio si existe
        IF NEW.sale_price IS NOT NULL AND NEW.sale_price != '' THEN
            notification_body := notification_body || ' - Precio: €' || NEW.sale_price;
        END IF;
        
        -- Agregar descuento si existe
        IF NEW.discount IS NOT NULL AND NEW.discount != '' THEN
            notification_body := notification_body || ' - Descuento: €' || NEW.discount;
        END IF;
        
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
                '🚗 Nueva Venta',
                notification_body,
                notification_data,
                NOW()
            );
            
            RAISE NOTICE '✅ Notificación de nueva venta enviada a % (%s) para vehículo %', admin_user.full_name, admin_user.role, NEW.license_plate;
        END LOOP;
        
        RAISE NOTICE '✅ Notificaciones de nueva venta enviadas a todos los administradores para vehículo %', NEW.license_plate;
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error enviando notificaciones de nueva venta: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 2: Crear trigger en la tabla sales_vehicles
DROP TRIGGER IF EXISTS new_sale_notification_trigger ON sales_vehicles;

CREATE TRIGGER new_sale_notification_trigger
    AFTER INSERT ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_sale_notification();

-- PASO 3: Verificar que se creó correctamente
SELECT 
    '✅ Trigger de notificación de nueva venta creado' as status,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles'
AND trigger_name = 'new_sale_notification_trigger';

-- PASO 4: Probar con una inserción de prueba (opcional)
-- INSERT INTO sales_vehicles (
--     license_plate, model, advisor, advisor_name, 
--     sale_date, customer_name, sale_amount, 
--     created_at, updated_at
-- ) VALUES (
--     'TEST001', 'BMW X3', 'JordiVi', 'JordiVi',
--     NOW(), 'Cliente Prueba', '45000',
--     NOW(), NOW()
-- );
