-- Función que se ejecutará cuando un vehículo sea marcado como recibido
CREATE OR REPLACE FUNCTION public.handle_vehicle_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar si el vehículo ha sido marcado como recibido (cambio de false a true)
  IF NEW.is_received = TRUE AND (OLD.is_received = FALSE OR OLD.is_received IS NULL) THEN
    -- Insertar en la tabla fotos solo si no existe ya un registro con esa matrícula
    INSERT INTO public.fotos (
      license_plate,
      model,
      disponible,
      estado_pintura,
      paint_status_date,
      nuevas_entradas_id
    )
    VALUES (
      NEW.license_plate,
      NEW.model,
      NOW(),  -- Fecha actual para disponible
      'pendiente',  -- Estado pintura por defecto
      NOW(),  -- Fecha de estado de pintura
      NEW.id  -- Referencia al ID de nuevas_entradas
    )
    ON CONFLICT (license_plate) 
    DO NOTHING;  -- No hacer nada si ya existe un registro con esa matrícula
    
    -- Registrar en el log que se ha creado un nuevo registro en fotos
    RAISE NOTICE 'Vehículo con matrícula % añadido a la tabla fotos', NEW.license_plate;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger que ejecutará la función cuando se actualice un registro en nuevas_entradas
DROP TRIGGER IF EXISTS on_vehicle_received ON public.nuevas_entradas;
CREATE TRIGGER on_vehicle_received
AFTER UPDATE ON public.nuevas_entradas
FOR EACH ROW
EXECUTE FUNCTION public.handle_vehicle_received();

-- Comentario para documentar el trigger
COMMENT ON FUNCTION public.handle_vehicle_received() IS 'Función que copia automáticamente los vehículos recibidos a la tabla fotos';
