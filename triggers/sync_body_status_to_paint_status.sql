-- Función que se ejecutará cuando se actualice el estado de carrocería en la tabla stock
CREATE OR REPLACE FUNCTION public.sync_body_status_to_paint_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado de carrocería cambia a "apto", actualizar el estado de pintura en la tabla fotos
  IF NEW.body_status = 'apto' AND (OLD.body_status != 'apto' OR OLD.body_status IS NULL) THEN
    -- Actualizar el estado de pintura en la tabla fotos para el vehículo con la misma matrícula
    UPDATE public.fotos
    SET 
      estado_pintura = 'apto',
      paint_status_date = NEW.body_status_date,
      paint_apto_date = NEW.body_status_date
    WHERE 
      license_plate = NEW.license_plate;
    
    -- Registrar en el log que se ha actualizado el estado de pintura
    RAISE NOTICE 'Estado de pintura actualizado a apto para el vehículo con matrícula %', NEW.license_plate;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger que ejecutará la función cuando se actualice un registro en stock
DROP TRIGGER IF EXISTS on_body_status_change ON public.stock;
CREATE TRIGGER on_body_status_change
AFTER UPDATE ON public.stock
FOR EACH ROW
EXECUTE FUNCTION public.sync_body_status_to_paint_status();

-- Comentario para documentar el trigger
COMMENT ON FUNCTION public.sync_body_status_to_paint_status() IS 'Función que sincroniza el estado de carrocería de stock con el estado de pintura en fotos';
