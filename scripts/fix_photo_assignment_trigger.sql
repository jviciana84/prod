-- Limpiar y reinstalar trigger de notificaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar triggers existentes
DROP TRIGGER IF EXISTS photo_assignment_notification_trigger ON fotos;
DROP TRIGGER IF EXISTS photo_assignment_notification_insert_trigger ON fotos;

-- 2. Eliminar función existente
DROP FUNCTION IF EXISTS send_photo_assignment_notification();

-- 3. Crear función nueva con icono correcto
CREATE OR REPLACE FUNCTION send_photo_assignment_notification()
RETURNS TRIGGER AS $func$
DECLARE
  photographer_name TEXT;
  vehicle_info RECORD;
BEGIN
  -- Solo proceder si se está asignando un fotógrafo (no es NULL)
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
    
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
    
    -- Crear notificación en la base de datos con icono correcto
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

-- 4. Crear trigger para UPDATE
CREATE TRIGGER photo_assignment_notification_trigger
AFTER UPDATE OF assigned_to ON fotos
FOR EACH ROW
EXECUTE FUNCTION send_photo_assignment_notification();

-- 5. Crear trigger para INSERT
CREATE TRIGGER photo_assignment_notification_insert_trigger
AFTER INSERT ON fotos
FOR EACH ROW
WHEN (NEW.assigned_to IS NOT NULL)
EXECUTE FUNCTION send_photo_assignment_notification();

-- 6. Verificar que se creó correctamente
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE '%photo_assignment%'; 