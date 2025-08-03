-- =====================================================
-- SINCRONIZAR FOTOS CON VENTAS (VERSIÓN OPTIMIZADA)
-- =====================================================
-- Descripción: Versión optimizada que elimina registros en lotes
-- para evitar timeouts en operaciones grandes
-- =====================================================

-- Función optimizada para sincronización manual de fotos con ventas
CREATE OR REPLACE FUNCTION sync_photos_with_sales()
RETURNS TABLE(
    processed_count INTEGER,
    removed_count INTEGER,
    message TEXT
) AS $$
DECLARE
    total_processed INTEGER := 0;
    total_removed INTEGER := 0;
    batch_size INTEGER := 100; -- Procesar en lotes de 100
    current_batch INTEGER := 0;
BEGIN
    -- Log de inicio
    RAISE NOTICE '🔄 Iniciando sincronización optimizada de fotos con ventas...';
    
    -- Eliminar registros en lotes para evitar timeouts
    LOOP
        -- Eliminar un lote de registros que están en fotos pero vendidos
        WITH sold_vehicles AS (
            SELECT DISTINCT license_plate 
            FROM sales_vehicles 
            WHERE license_plate IS NOT NULL
        ),
        to_remove AS (
            SELECT f.id
            FROM fotos f
            INNER JOIN sold_vehicles sv ON f.license_plate = sv.license_plate
            LIMIT batch_size
        )
        DELETE FROM fotos 
        WHERE id IN (SELECT id FROM to_remove);
        
        -- Contar cuántos registros se eliminaron en este lote
        GET DIAGNOSTICS current_batch = ROW_COUNT;
        
        -- Si no se eliminó ninguno, hemos terminado
        IF current_batch = 0 THEN
            EXIT;
        END IF;
        
        total_removed := total_removed + current_batch;
        total_processed := total_processed + current_batch;
        
        RAISE NOTICE '✅ Lote procesado: % registros eliminados (total: %)', 
            current_batch, total_removed;
            
        -- Pequeña pausa para evitar sobrecarga
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RETURN QUERY SELECT 
        total_processed,
        total_removed,
        'Sincronización optimizada completada. Registros eliminados: ' || total_removed;
        
    RAISE NOTICE '✅ Sincronización optimizada completada. Eliminados: %', total_removed;
END;
$$ LANGUAGE plpgsql;

-- Comentario para la función
COMMENT ON FUNCTION sync_photos_with_sales() IS 'Sincronización optimizada de fotos con ventas (procesamiento en lotes)'; 