-- =====================================================
-- FUNCIÓN PARA MARCAR FOTOS COMO COMPLETADAS
-- =====================================================

CREATE OR REPLACE FUNCTION mark_photos_as_completed()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_updated integer := 0;
    updated_vehicles json[] := '{}';
    vehicle_record record;
    result json;
BEGIN
    -- Marcar vehículos como fotografiados basándose en URL foto 9 del CSV
    WITH updated AS (
        UPDATE fotos 
        SET 
            photos_completed = true,
            photos_completed_date = NOW(),
            updated_at = NOW()
        WHERE license_plate IN (
            SELECT ds."Matrícula"
            FROM duc_scraper ds
            WHERE ds."URL foto 9" IS NOT NULL 
            AND ds."URL foto 9" != ''
            AND ds."Matrícula" IS NOT NULL
        )
        AND photos_completed = false
        RETURNING id, license_plate, model, photos_completed_date
    )
    SELECT COUNT(*) INTO total_updated FROM updated;
    
    -- Obtener detalles de los vehículos actualizados
    FOR vehicle_record IN 
        SELECT 
            f.license_plate,
            f.model,
            f.photos_completed_date,
            ds."URL foto 9" as url_foto_9
        FROM fotos f
        LEFT JOIN duc_scraper ds ON f.license_plate = ds."Matrícula"
        WHERE f.photos_completed = true
        AND f.photos_completed_date >= NOW() - INTERVAL '1 hour'
        ORDER BY f.photos_completed_date DESC
    LOOP
        updated_vehicles := array_append(updated_vehicles, to_json(vehicle_record));
    END LOOP;
    
    -- Construir resultado
    result := json_build_object(
        'success', true,
        'total_updated', total_updated,
        'updated_vehicles', updated_vehicles,
        'executed_at', now()
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'total_updated', 0,
            'executed_at', now()
        );
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION mark_photos_as_completed() IS 'Función para marcar automáticamente vehículos como fotografiados basándose en URL foto 9 del CSV del scraper. Se ejecuta cada 15 minutos via GitHub Actions.'; 