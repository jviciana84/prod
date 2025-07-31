-- =====================================================
-- CORREGIR TRIGGER PARA USAR IS_SOLD EN STOCK
-- =====================================================
-- Descripción: Corregir el trigger para usar is_sold en lugar de status
-- =====================================================

-- 1. Eliminar el trigger actual
DROP TRIGGER IF EXISTS trigger_handle_availability_change ON duc_scraper;

-- 2. Eliminar la función actual
DROP FUNCTION IF EXISTS handle_availability_change();

-- 3. Crear la función correcta que usa is_sold
CREATE OR REPLACE FUNCTION handle_availability_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si cambió de "Disponible" a "Reservado"
    IF OLD."Disponibilidad" ILIKE '%disponible%' 
    AND NEW."Disponibilidad" ILIKE '%reservado%' THEN
        
        -- Marcar como vendido en stock usando is_sold
        UPDATE stock 
        SET is_sold = true 
        WHERE license_plate = NEW."Matrícula"
        AND (is_sold IS NULL OR is_sold = false);
        
        -- Marcar en fotos como "vendido"
        UPDATE fotos 
        SET estado_pintura = 'vendido' 
        WHERE license_plate = NEW."Matrícula";
        
        RAISE NOTICE '✅ Vehículo % marcado como vendido (is_sold = true)', NEW."Matrícula";
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
SELECT '✅ Trigger corregido para usar is_sold' as status; 