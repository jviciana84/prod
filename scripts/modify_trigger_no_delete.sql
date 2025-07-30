-- =====================================================
-- MODIFICAR TRIGGER PARA NO ELIMINAR DE FOTOS
-- =====================================================
-- Descripción: Cambiar el trigger para que marque como vendido
-- en lugar de eliminar de la tabla fotos
-- =====================================================

-- 1. Eliminar el trigger actual
DROP TRIGGER IF EXISTS trigger_remove_from_photos_on_sale ON sales_vehicles;

-- 2. Crear nueva función que marque como vendido en lugar de eliminar
CREATE OR REPLACE FUNCTION handle_vehicle_sold_mark_in_photos()
RETURNS TRIGGER AS $$
BEGIN
    -- Log de inicio
    RAISE NOTICE '🔄 Procesando vehículo vendido: %', NEW.license_plate;
    
    -- Marcar como vendido en la tabla fotos (NO eliminar)
    UPDATE fotos 
    SET 
        photos_completed = true,
        photos_completed_date = NOW(),
        estado_pintura = 'vendido'
    WHERE license_plate = NEW.license_plate;
    
    RAISE NOTICE '✅ Vehículo % marcado como vendido en fotos', NEW.license_plate;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error marcando como vendido: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear nuevo trigger
CREATE TRIGGER trigger_mark_as_sold_in_photos
    AFTER INSERT ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_vehicle_sold_mark_in_photos();

-- 4. Modificar función de sincronización para marcar en lugar de eliminar
CREATE OR REPLACE FUNCTION sync_photos_with_sales()
RETURNS TABLE(
    processed_count INTEGER,
    marked_count INTEGER,
    message TEXT
) AS $$
DECLARE
    sold_vehicle RECORD;
    photos_count INTEGER;
    total_processed INTEGER := 0;
    total_marked INTEGER := 0;
BEGIN
    -- Log de inicio
    RAISE NOTICE '🔄 Iniciando sincronización de fotos con ventas...';
    
    -- Procesar todos los vehículos vendidos
    FOR sold_vehicle IN 
        SELECT DISTINCT license_plate 
        FROM sales_vehicles 
        WHERE license_plate IS NOT NULL
    LOOP
        -- Contar registros en fotos para este vehículo
        SELECT COUNT(*) INTO photos_count
        FROM fotos 
        WHERE license_plate = sold_vehicle.license_plate;
        
        -- Si hay registros en fotos, marcarlos como vendidos
        IF photos_count > 0 THEN
            UPDATE fotos 
            SET 
                photos_completed = true,
                photos_completed_date = NOW(),
                estado_pintura = 'vendido'
            WHERE license_plate = sold_vehicle.license_plate;
            
            total_marked := total_marked + photos_count;
            RAISE NOTICE '✅ Vehículo % marcado como vendido (% registros)', 
                sold_vehicle.license_plate, photos_count;
        END IF;
        
        total_processed := total_processed + 1;
    END LOOP;
    
    RETURN QUERY SELECT 
        total_processed,
        total_marked,
        'Sincronización completada. Vehículos procesados: ' || total_processed || 
        ', Registros marcados como vendidos: ' || total_marked;
        
    RAISE NOTICE '✅ Sincronización completada. Procesados: %, Marcados: %', 
        total_processed, total_marked;
END;
$$ LANGUAGE plpgsql;

-- 5. Modificar función de verificación de inconsistencias
CREATE OR REPLACE FUNCTION check_photos_sales_inconsistencies()
RETURNS TABLE(
    license_plate TEXT,
    model TEXT,
    sale_date TIMESTAMPTZ,
    advisor TEXT,
    photos_status TEXT,
    inconsistency_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sv.license_plate,
        sv.model,
        sv.sale_date,
        COALESCE(sv.advisor_name, sv.advisor) as advisor,
        CASE 
            WHEN f.license_plate IS NULL THEN 'NO TIENE FOTOS'
            WHEN f.photos_completed = false THEN 'FOTOS PENDIENTES'
            WHEN f.estado_pintura = 'vendido' THEN 'VENDIDO SIN FOTOS'
            ELSE 'FOTOS COMPLETADAS'
        END as photos_status,
        'VENDIDO EN FOTOS PENDIENTES' as inconsistency_type
    FROM sales_vehicles sv
    LEFT JOIN fotos f ON sv.license_plate = f.license_plate
    WHERE f.license_plate IS NOT NULL 
    AND f.photos_completed = false
    ORDER BY sv.sale_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Comentarios para documentar
COMMENT ON FUNCTION handle_vehicle_sold_mark_in_photos() IS 'Marca vehículos como vendidos en fotos en lugar de eliminarlos';
COMMENT ON FUNCTION sync_photos_with_sales() IS 'Sincronización manual de fotos con ventas (marcar como vendidos)';
COMMENT ON FUNCTION check_photos_sales_inconsistencies() IS 'Verifica inconsistencias entre fotos y ventas';

-- 7. Verificar cambios
SELECT '✅ Sistema modificado para marcar como vendidos en lugar de eliminar' as info; 