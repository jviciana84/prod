-- =====================================================
-- ARREGLAR TRIGGER DEL SCRAPER - SOLO STOCK Y FOTOS
-- =====================================================
-- Eliminar el trigger problemático que intenta insertar en sales_vehicles
-- Crear el trigger correcto que solo maneja stock y fotos
-- =====================================================

-- 1. Eliminar el trigger problemático
DROP TRIGGER IF EXISTS trigger_sync_reserved_vehicles ON duc_scraper;

-- 2. Eliminar la función problemática
DROP FUNCTION IF EXISTS trigger_sync_reserved_on_csv_import();

-- 3. Crear la función correcta que solo maneja stock y fotos
CREATE OR REPLACE FUNCTION handle_availability_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si cambió de "Disponible" a "Reservado"
    IF OLD."Disponibilidad" ILIKE '%disponible%' 
    AND NEW."Disponibilidad" ILIKE '%reservado%' THEN
        
        -- Mover de stock "disponible" a "vendido"
        UPDATE stock 
        SET status = 'vendido' 
        WHERE license_plate = NEW."Matrícula"
        AND status = 'disponible';
        
        -- Marcar en fotos como "vendido"
        UPDATE fotos 
        SET estado_pintura = 'vendido' 
        WHERE license_plate = NEW."Matrícula";
        
        RAISE NOTICE '✅ Vehículo % movido de disponible a vendido', NEW."Matrícula";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear el trigger correcto
CREATE TRIGGER trigger_handle_availability_change
    AFTER UPDATE ON duc_scraper
    FOR EACH ROW
    EXECUTE FUNCTION handle_availability_change();

-- 5. Verificar que se creó correctamente
SELECT '✅ Trigger problemático eliminado' as status;
SELECT '✅ Nuevo trigger creado correctamente' as status; 