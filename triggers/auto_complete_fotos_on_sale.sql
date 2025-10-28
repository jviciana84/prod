-- =====================================================
-- TRIGGER: Marcar fotos como completadas al vender
-- =====================================================
-- REGLA: Si un vehículo está vendido, NO puede estar pendiente de fotos
-- =====================================================

CREATE OR REPLACE FUNCTION auto_complete_fotos_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se inserta una venta, marcar fotos como completadas
  UPDATE fotos
  SET 
    photos_completed = TRUE,
    photos_completed_date = COALESCE(photos_completed_date, NOW()),
    estado_pintura = 'vendido',
    updated_at = NOW()
  WHERE license_plate = NEW.license_plate
    AND photos_completed = FALSE; -- Solo si está pendiente
  
  RAISE NOTICE 'Vehículo vendido - Fotos marcadas como completadas: %', NEW.license_plate;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_auto_complete_fotos_on_sale ON sales_vehicles;

-- Crear trigger
CREATE TRIGGER trigger_auto_complete_fotos_on_sale
  AFTER INSERT ON sales_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_fotos_on_sale();

COMMENT ON FUNCTION auto_complete_fotos_on_sale() IS 
  'Marca automáticamente como completadas las fotos cuando un vehículo se vende. REGLA: Vendido = NO puede estar pendiente de fotos.';

-- Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger creado: auto_complete_fotos_on_sale';
  RAISE NOTICE '🎯 REGLA: Si un vehículo está vendido, NO puede estar pendiente de fotos';
  RAISE NOTICE '   - Al insertar en sales_vehicles, marca automáticamente fotos como completadas';
  RAISE NOTICE '   - Estado de pintura cambia a "vendido"';
END $$;

