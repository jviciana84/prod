-- Arreglar icono corrupto en el trigger
-- Ejecutar en Supabase SQL Editor

-- Actualizar la función del trigger con icono correcto
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
      E'📷 Nuevas fotografías asignadas',
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