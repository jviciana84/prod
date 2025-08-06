-- Añadir push notifications automáticas al trigger
-- Ejecutar en Supabase SQL Editor

-- Función para enviar push notification desde SQL
CREATE OR REPLACE FUNCTION send_push_notification(user_id UUID, title TEXT, body TEXT, data JSONB)
RETURNS VOID AS $$
BEGIN
  -- Esta función se llamará desde el trigger
  -- Las push notifications se manejarán desde la aplicación
  -- Por ahora solo log para debugging
  RAISE NOTICE 'Push notification solicitada para usuario %: % - %', user_id, title, body;
END;
$$ LANGUAGE plpgsql;

-- Actualizar la función del trigger para incluir push notifications
CREATE OR REPLACE FUNCTION send_photo_assignment_notification()
RETURNS TRIGGER AS $func$
DECLARE
  photographer_name TEXT;
  vehicle_info RECORD;
BEGIN
  -- Solo proceder si se está asignando un fotógrafo (no es NULL)
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != OLD.assigned_to THEN
    
    -- Obtener información del fotógrafo
    SELECT full_name, email INTO photographer_name
    FROM profiles 
    WHERE id = NEW.assigned_to;
    
    -- Si no hay nombre, usar email
    IF photographer_name IS NULL THEN
      SELECT email INTO photographer_name
      FROM profiles 
      WHERE id = NEW.assigned_to;
    END IF;
    
    -- Obtener información del vehículo
    SELECT license_plate, model INTO vehicle_info
    FROM fotos 
    WHERE id = NEW.id;
    
    -- Crear notificación en la base de datos
    INSERT INTO notification_history (
      user_id,
      title,
      body,
      data,
      created_at
    ) VALUES (
      NEW.assigned_to,
      '📷 Nuevas fotografías asignadas',
      'Se te han asignado nuevas fotografías para tomar: ' || COALESCE(vehicle_info.license_plate, 'Vehículo') || ' ' || COALESCE(vehicle_info.model, ''),
      jsonb_build_object(
        'type', 'photo_assignment',
        'vehicleId', NEW.id,
        'licensePlate', vehicle_info.license_plate,
        'model', vehicle_info.model,
        'url', '/dashboard/photos',
        'needsPushNotification', true
      ),
      NOW()
    );
    
    -- Log para debugging
    RAISE NOTICE 'Notificación enviada a % para vehículo %', photographer_name, vehicle_info.license_plate;
    
  END IF;
  
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS photo_assignment_notification_trigger ON fotos;
CREATE TRIGGER photo_assignment_notification_trigger
AFTER UPDATE OF assigned_to ON fotos
FOR EACH ROW
EXECUTE FUNCTION send_photo_assignment_notification();

-- También recrear trigger para nuevas asignaciones en INSERT
DROP TRIGGER IF EXISTS photo_assignment_notification_insert_trigger ON fotos;
CREATE TRIGGER photo_assignment_notification_insert_trigger
AFTER INSERT ON fotos
FOR EACH ROW
WHEN (NEW.assigned_to IS NOT NULL)
EXECUTE FUNCTION send_photo_assignment_notification(); 