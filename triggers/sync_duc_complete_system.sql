-- =====================================================
-- TRIGGER PRINCIPAL: duc_scraper → stock + fotos + nuevas_entradas
-- =====================================================
-- Detecta automáticamente si tiene fotos y marca recepción
-- =====================================================

CREATE OR REPLACE FUNCTION sync_duc_to_all_tables()
RETURNS TRIGGER AS $$
DECLARE
  v_has_photos BOOLEAN;
  v_reception_date TIMESTAMP;
BEGIN
  -- Solo procesar si tiene matrícula y modelo
  IF NEW."Matrícula" IS NULL OR NEW."Modelo" IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Detectar si tiene FOTOS REALES en DUC (foto 9+, no dummy 1-8)
  v_has_photos := (
    NEW."URL foto 9" IS NOT NULL AND NEW."URL foto 9" != '' OR
    NEW."URL foto 10" IS NOT NULL AND NEW."URL foto 10" != '' OR
    NEW."URL foto 11" IS NOT NULL AND NEW."URL foto 11" != '' OR
    NEW."URL foto 12" IS NOT NULL AND NEW."URL foto 12" != '' OR
    NEW."URL foto 13" IS NOT NULL AND NEW."URL foto 13" != '' OR
    NEW."URL foto 14" IS NOT NULL AND NEW."URL foto 14" != '' OR
    NEW."URL foto 15" IS NOT NULL AND NEW."URL foto 15" != ''
  );
  
  -- Si tiene fotos, asumimos que llegó hace 2 días
  IF v_has_photos THEN
    v_reception_date := NOW() - INTERVAL '2 days';
  ELSE
    v_reception_date := NULL;
  END IF;
  
  -- 1. NUEVAS_ENTRADAS (si no existe)
  INSERT INTO nuevas_entradas (
    license_plate,
    model,
    vehicle_type,
    is_received,
    reception_date,
    purchase_date,
    created_at
  ) VALUES (
    NEW."Matrícula",
    NEW."Modelo",
    CASE 
      WHEN NEW."Modelo" ILIKE '%moto%' OR NEW."Modelo" ILIKE '%motorrad%' THEN 'Moto'
      ELSE 'Turismo'
    END,
    v_has_photos,  -- Si tiene fotos = ya recibido
    v_reception_date,
    CURRENT_DATE,
    NOW()
  )
  ON CONFLICT (license_plate) 
  DO UPDATE SET
    is_received = CASE 
      WHEN v_has_photos THEN TRUE
      ELSE nuevas_entradas.is_received
    END,
    reception_date = CASE
      WHEN v_has_photos THEN v_reception_date
      ELSE nuevas_entradas.reception_date
    END,
    updated_at = NOW();
  
  -- 2. STOCK (si no existe)
  INSERT INTO stock (
    license_plate,
    model,
    physical_reception_date,
    is_available,
    is_sold,
    auto_marked_received,
    created_at
  ) VALUES (
    NEW."Matrícula",
    NEW."Modelo",
    v_reception_date,
    v_has_photos,  -- Si tiene fotos = disponible
    CASE WHEN NEW."Disponibilidad" = 'VENDIDO' THEN TRUE ELSE FALSE END,
    v_has_photos,  -- Marca automática si tiene fotos
    NOW()
  )
  ON CONFLICT (license_plate) 
  DO UPDATE SET
    model = EXCLUDED.model,
    physical_reception_date = COALESCE(stock.physical_reception_date, EXCLUDED.physical_reception_date),
    is_available = CASE 
      WHEN EXCLUDED.is_available THEN TRUE
      ELSE stock.is_available
    END,
    auto_marked_received = CASE
      WHEN EXCLUDED.auto_marked_received THEN TRUE
      ELSE stock.auto_marked_received
    END,
    updated_at = NOW();
  
  -- 3. FOTOS (si no existe)
  INSERT INTO fotos (
    license_plate,
    model,
    estado_pintura,
    photos_completed,
    physical_reception_date,
    is_available,
    auto_completed,
    paint_status_date
  ) VALUES (
    NEW."Matrícula",
    NEW."Modelo",
    CASE WHEN v_has_photos THEN 'completado' ELSE 'pendiente' END,
    v_has_photos,
    v_reception_date,
    v_has_photos,
    v_has_photos,
    NOW()
  )
  ON CONFLICT (license_plate) 
  DO UPDATE SET
    photos_completed = CASE 
      WHEN EXCLUDED.photos_completed THEN TRUE
      ELSE fotos.photos_completed
    END,
    estado_pintura = CASE
      WHEN EXCLUDED.photos_completed THEN 'completado'
      ELSE fotos.estado_pintura
    END,
    physical_reception_date = COALESCE(fotos.physical_reception_date, EXCLUDED.physical_reception_date),
    is_available = CASE 
      WHEN EXCLUDED.is_available THEN TRUE
      ELSE fotos.is_available
    END,
    auto_completed = CASE
      WHEN EXCLUDED.auto_completed THEN TRUE
      ELSE fotos.auto_completed
    END,
    updated_at = NOW();
  
  RAISE NOTICE 'Vehículo sincronizado: % (has_photos: %, reception_date: %)', 
    NEW."Matrícula", v_has_photos, v_reception_date;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_sync_duc_to_all_tables ON duc_scraper;
CREATE TRIGGER trigger_sync_duc_to_all_tables
  AFTER INSERT OR UPDATE ON duc_scraper
  FOR EACH ROW
  EXECUTE FUNCTION sync_duc_to_all_tables();

COMMENT ON FUNCTION sync_duc_to_all_tables() IS 
  'Sincroniza automáticamente vehículos de duc_scraper a stock, fotos y nuevas_entradas. Detecta si tiene fotos y marca recepción -2 días.';

-- =====================================================
-- TRIGGER: Fotos completadas → Marcar recibido (-2 días)
-- =====================================================
-- Prevalece sobre marcado manual
-- =====================================================

CREATE OR REPLACE FUNCTION auto_mark_received_on_photos_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_reception_date TIMESTAMP;
BEGIN
  -- Solo si se acaba de completar (cambio de false/null a true)
  IF NEW.photos_completed = TRUE 
     AND (OLD.photos_completed IS NULL OR OLD.photos_completed = FALSE) THEN
    
    -- Fecha de recepción: hace 2 días (fijo)
    v_reception_date := NOW() - INTERVAL '2 days';
    
    -- Actualizar la misma tabla fotos (sin conflictos)
    UPDATE fotos
    SET 
      physical_reception_date = v_reception_date,
      is_available = TRUE,
      auto_completed = TRUE,
      estado_pintura = 'completado',
      updated_at = NOW()
    WHERE id = NEW.id;
    
    -- Actualizar en stock
    UPDATE stock
    SET 
      physical_reception_date = v_reception_date,
      is_available = TRUE,
      auto_marked_received = TRUE,
      updated_at = NOW()
    WHERE license_plate = NEW.license_plate
      AND (stock.auto_marked_received = FALSE OR stock.auto_marked_received IS NULL);
    
    -- Marcar como recibido en nuevas_entradas (PREVALECE sobre manual)
    UPDATE nuevas_entradas
    SET 
      is_received = TRUE,
      reception_date = v_reception_date,
      updated_at = NOW()
    WHERE license_plate = NEW.license_plate
      AND (nuevas_entradas.is_received = FALSE OR nuevas_entradas.is_received IS NULL);
    
    RAISE NOTICE 'Vehículo marcado automáticamente como recibido (fotos completadas): % en fecha %', 
      NEW.license_plate, v_reception_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_mark_received ON fotos;
CREATE TRIGGER trigger_auto_mark_received
  AFTER UPDATE ON fotos
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_received_on_photos_complete();

COMMENT ON FUNCTION auto_mark_received_on_photos_complete() IS 
  'Cuando fotos se marca como completado, marca automáticamente recepción hace 2 días en stock, fotos y nuevas_entradas. PREVALECE sobre marcado manual.';

-- =====================================================
-- TRIGGER: nuevas_entradas.is_received → stock/fotos
-- =====================================================
-- Solo actualiza si NO fue marcado automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION sync_received_status()
RETURNS TRIGGER AS $$
DECLARE
  v_reception_date TIMESTAMP;
BEGIN
  -- Solo si cambia a recibido
  IF NEW.is_received = TRUE AND (OLD.is_received = FALSE OR OLD.is_received IS NULL) THEN
    
    v_reception_date := COALESCE(NEW.reception_date, NOW());
    
    -- Actualizar stock (solo si NO fue automático - automático prevalece)
    UPDATE stock
    SET 
      physical_reception_date = CASE
        WHEN stock.auto_marked_received = TRUE THEN stock.physical_reception_date
        ELSE v_reception_date
      END,
      is_available = TRUE,
      updated_at = NOW()
    WHERE license_plate = NEW.license_plate;
    
    -- Actualizar fotos (solo si NO fue automático - automático prevalece)
    UPDATE fotos
    SET 
      physical_reception_date = CASE
        WHEN fotos.auto_completed = TRUE THEN fotos.physical_reception_date
        ELSE v_reception_date
      END,
      is_available = TRUE,
      updated_at = NOW()
    WHERE license_plate = NEW.license_plate;
    
    RAISE NOTICE 'Vehículo marcado como recibido manualmente: % (automático prevalece si existe)', 
      NEW.license_plate;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_received_status ON nuevas_entradas;
CREATE TRIGGER trigger_sync_received_status
  AFTER UPDATE ON nuevas_entradas
  FOR EACH ROW
  EXECUTE FUNCTION sync_received_status();

COMMENT ON FUNCTION sync_received_status() IS 
  'Cuando nuevas_entradas se marca como recibido, actualiza stock y fotos. Respeta fechas automáticas (no las sobreescribe).';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers creados exitosamente:';
  RAISE NOTICE '  1. sync_duc_to_all_tables - duc_scraper → stock + fotos + nuevas_entradas';
  RAISE NOTICE '  2. auto_mark_received_on_photos_complete - Fotos completadas → -2 días';
  RAISE NOTICE '  3. sync_received_status - nuevas_entradas → stock/fotos';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Sistema listo. Lógica:';
  RAISE NOTICE '  - Fotos completadas = recibido hace 2 días (prevalece)';
  RAISE NOTICE '  - Manual solo aplica si no fue marcado automáticamente';
  RAISE NOTICE '  - Botón disponibilidad puede togglearse manualmente';
END $$;

