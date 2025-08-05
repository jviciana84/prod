-- =====================================================
-- ARREGLAR TRIGGER PARA VEHÍCULOS RESERVADOS
-- =====================================================
-- Descripción: Arreglar el trigger para que procese vehículos reservados
-- tanto en INSERT como en UPDATE
-- =====================================================

-- 1. Eliminar el trigger actual
DROP TRIGGER IF EXISTS trigger_handle_availability_change ON duc_scraper;

-- 2. Eliminar la función actual
DROP FUNCTION IF EXISTS handle_availability_change();

-- 3. Crear la función corregida que procesa tanto INSERT como UPDATE
CREATE OR REPLACE FUNCTION handle_availability_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Procesar tanto INSERT como UPDATE cuando sea "Reservado"
    IF NEW."Disponibilidad" ILIKE '%reservado%' THEN
        
        -- Marcar como vendido en stock usando is_sold
        UPDATE stock 
        SET is_sold = true 
        WHERE license_plate = NEW."Matrícula"
        AND (is_sold IS NULL OR is_sold = false);
        
        -- Marcar en fotos como "vendido"
        UPDATE fotos 
        SET estado_pintura = 'vendido' 
        WHERE license_plate = NEW."Matrícula";
        
        -- Crear registro en sales_vehicles si no existe
        IF NOT EXISTS (
            SELECT 1 FROM sales_vehicles 
            WHERE license_plate = NEW."Matrícula"
        ) THEN
            INSERT INTO sales_vehicles (
                license_plate,
                model,
                vehicle_type,
                sale_date,
                advisor,
                payment_method,
                payment_status,
                body_status,
                mechanical_status,
                validation_status,
                created_at,
                updated_at
            ) VALUES (
                NEW."Matrícula",
                COALESCE(NEW."Modelo", 'Sin modelo'),
                'Coche',
                COALESCE(NEW."Fecha disponibilidad"::timestamp, NEW.last_seen_date),
                COALESCE(NEW."Concesionario", 'Sin concesionario'),
                'Contado',
                'Completado',
                'Pendiente',
                'Pendiente',
                'Pendiente',
                NOW(),
                NOW()
            );
        END IF;
        
        RAISE NOTICE '✅ Vehículo % marcado como vendido (is_sold = true)', NEW."Matrícula";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear el trigger corregido que funciona en INSERT Y UPDATE
CREATE TRIGGER trigger_handle_availability_change
    AFTER INSERT OR UPDATE ON duc_scraper
    FOR EACH ROW
    EXECUTE FUNCTION handle_availability_change();

-- 5. Verificar que se creó correctamente
SELECT '✅ Trigger corregido para INSERT y UPDATE' as status; 