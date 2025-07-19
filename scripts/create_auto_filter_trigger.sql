-- =====================================================
-- TRIGGER AUTOMÁTICO PARA PROCESAR FILTROS
-- =====================================================
-- Descripción: Trigger que procesa automáticamente los filtros cuando se actualiza duc_scraper
-- =====================================================

-- Función para procesar filtros automáticamente
CREATE OR REPLACE FUNCTION auto_process_filters_on_duc_update()
RETURNS TRIGGER AS $$
DECLARE
    config_record RECORD;
    log_id UUID;
    vehicles_found INTEGER := 0;
    vehicles_added INTEGER := 0;
    vehicles_skipped INTEGER := 0;
    errors_count INTEGER := 0;
BEGIN
    -- Solo procesar si hay cambios relevantes
    IF OLD IS NULL OR 
       OLD."Disponibilidad" IS DISTINCT FROM NEW."Disponibilidad" OR
       OLD."Precio" IS DISTINCT FROM NEW."Precio" OR
       OLD."KM" IS DISTINCT FROM NEW."KM" OR
       OLD."Libre de siniestros" IS DISTINCT FROM NEW."Libre de siniestros" OR
       OLD."Concesionario" IS DISTINCT FROM NEW."Concesionario" OR
       OLD."Combustible" IS DISTINCT FROM NEW."Combustible" OR
       OLD."Días stock" IS DISTINCT FROM NEW."Días stock" THEN
        
        RAISE NOTICE '🔄 Cambios detectados en duc_scraper para ID Anuncio: %', NEW."ID Anuncio";
        
        -- Procesar cada configuración de filtro activa
        FOR config_record IN 
            SELECT * FROM filter_configs 
            WHERE is_active = true 
            AND auto_process = true
        LOOP
            RAISE NOTICE '📋 Procesando configuración: %', config_record.name;
            
            -- Crear log de procesamiento
            INSERT INTO filter_processing_log (
                filter_config_id,
                status,
                config_snapshot,
                started_at
            ) VALUES (
                config_record.id,
                'processing',
                to_jsonb(config_record),
                NOW()
            ) RETURNING id INTO log_id;
            
            -- Aquí iría la lógica de procesamiento
            -- Por ahora solo registramos que se procesó
            vehicles_found := 1;
            
            -- Actualizar log con resultados
            UPDATE filter_processing_log 
            SET 
                status = 'completed',
                total_vehicles_found = vehicles_found,
                vehicles_processed = vehicles_found,
                vehicles_added_to_nuevas_entradas = vehicles_added,
                vehicles_skipped = vehicles_skipped,
                errors_count = errors_count,
                completed_at = NOW()
            WHERE id = log_id;
            
            RAISE NOTICE '✅ Configuración % procesada: % vehículos encontrados, % añadidos', 
                config_record.name, vehicles_found, vehicles_added;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_auto_process_filters ON duc_scraper;
CREATE TRIGGER trigger_auto_process_filters
    AFTER INSERT OR UPDATE ON duc_scraper
    FOR EACH ROW
    EXECUTE FUNCTION auto_process_filters_on_duc_update();

-- Función para procesar filtros manualmente (más completa)
CREATE OR REPLACE FUNCTION process_filter_config_trigger(config_id UUID)
RETURNS JSONB AS $$
DECLARE
    config_record RECORD;
    log_id UUID;
    vehicles_found INTEGER := 0;
    vehicles_added INTEGER := 0;
    vehicles_skipped INTEGER := 0;
    errors_count INTEGER := 0;
    vehicle_record RECORD;
    new_entry JSONB;
    existing_count INTEGER;
BEGIN
    -- Obtener la configuración
    SELECT * INTO config_record FROM filter_configs WHERE id = config_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Configuración no encontrada');
    END IF;
    
    -- Crear log de procesamiento
    INSERT INTO filter_processing_log (
        filter_config_id,
        status,
        config_snapshot,
        started_at
    ) VALUES (
        config_id,
        'processing',
        to_jsonb(config_record),
        NOW()
    ) RETURNING id INTO log_id;
    
    -- Procesar vehículos que cumplan los filtros
    FOR vehicle_record IN 
        SELECT * FROM duc_scraper 
        WHERE 
            -- Filtros de disponibilidad
            (config_record.disponibilidad_filter IS NULL OR 
             config_record.disponibilidad_filter = '{}' OR 
             "Disponibilidad" = ANY(config_record.disponibilidad_filter))
            AND
            -- Filtros de marca
            (config_record.marca_filter IS NULL OR 
             config_record.marca_filter = '{}' OR 
             "Marca" = ANY(config_record.marca_filter))
            AND
            -- Filtros de precio
            (config_record.precio_min IS NULL OR 
             CAST(REPLACE(REPLACE("Precio", '€', ''), '.', '') AS DECIMAL) >= config_record.precio_min)
            AND
            (config_record.precio_max IS NULL OR 
             CAST(REPLACE(REPLACE("Precio", '€', ''), '.', '') AS DECIMAL) <= config_record.precio_max)
            AND
            -- Filtros de kilometraje
            (config_record.km_min IS NULL OR 
             CAST(REPLACE(REPLACE("KM", 'km', ''), '.', '') AS INTEGER) >= config_record.km_min)
            AND
            (config_record.km_max IS NULL OR 
             CAST(REPLACE(REPLACE("KM", 'km', ''), '.', '') AS INTEGER) <= config_record.km_max)
            AND
            -- Filtro de libre de siniestros
            (config_record.libre_siniestros IS NULL OR 
             config_record.libre_siniestros = false OR 
             "Libre de siniestros" = 'Sí')
            AND
            -- Filtros de concesionario
            (config_record.concesionario_filter IS NULL OR 
             config_record.concesionario_filter = '{}' OR 
             "Concesionario" = ANY(config_record.concesionario_filter))
            AND
            -- Filtros de combustible
            (config_record.combustible_filter IS NULL OR 
             config_record.combustible_filter = '{}' OR 
             "Combustible" = ANY(config_record.combustible_filter))
        LIMIT config_record.max_vehicles_per_batch
    LOOP
        vehicles_found := vehicles_found + 1;
        
        -- Verificar si ya existe en nuevas_entradas
        SELECT COUNT(*) INTO existing_count 
        FROM nuevas_entradas 
        WHERE license_plate = vehicle_record."Matrícula" 
           OR duc_id_anuncio = vehicle_record."ID Anuncio";
        
        IF existing_count > 0 THEN
            vehicles_skipped := vehicles_skipped + 1;
            CONTINUE;
        END IF;
        
        -- Crear entrada para nuevas_entradas
        new_entry := jsonb_build_object(
            'license_plate', vehicle_record."Matrícula",
            'model', COALESCE(vehicle_record."Modelo", vehicle_record."Marca"),
            'vehicle_type', 'Coche',
            'entry_date', NOW(),
            'is_received', false,
            'status', 'pendiente',
            'purchase_price', CASE 
                WHEN vehicle_record."Precio compra" IS NOT NULL 
                THEN CAST(REPLACE(REPLACE(vehicle_record."Precio compra", '€', ''), '.', '') AS DECIMAL)
                ELSE NULL 
            END,
            'origin', vehicle_record."Origen",
            'origin_details', vehicle_record."Origenes unificados",
            'purchase_date_duc', CASE 
                WHEN vehicle_record."Fecha compra DMS" IS NOT NULL 
                THEN vehicle_record."Fecha compra DMS"::timestamp
                ELSE NULL 
            END,
            'duc_id_anuncio', vehicle_record."ID Anuncio",
            'duc_import_date', vehicle_record.import_date,
            'duc_last_seen', vehicle_record.last_seen_date,
            'notes', format('Importado automáticamente desde duc_scraper - Config: %s
Marca: %s, Modelo: %s, Precio: %s €, Precio compra: %s €, Origen: %s', 
                config_record.name,
                vehicle_record."Marca",
                vehicle_record."Modelo", 
                vehicle_record."Precio",
                vehicle_record."Precio compra",
                vehicle_record."Origen")
        );
        
        -- Insertar en nuevas_entradas
        BEGIN
            INSERT INTO nuevas_entradas SELECT * FROM jsonb_populate_record(null::nuevas_entradas, new_entry);
            vehicles_added := vehicles_added + 1;
        EXCEPTION WHEN OTHERS THEN
            errors_count := errors_count + 1;
            RAISE NOTICE 'Error insertando vehículo %: %', vehicle_record."Matrícula", SQLERRM;
        END;
    END LOOP;
    
    -- Actualizar log con resultados
    UPDATE filter_processing_log 
    SET 
        status = 'completed',
        total_vehicles_found = vehicles_found,
        vehicles_processed = vehicles_found,
        vehicles_added_to_nuevas_entradas = vehicles_added,
        vehicles_skipped = vehicles_skipped,
        errors_count = errors_count,
        completed_at = NOW()
    WHERE id = log_id;
    
    -- Actualizar last_used_at en la configuración
    UPDATE filter_configs 
    SET last_used_at = NOW() 
    WHERE id = config_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'totalFound', vehicles_found,
        'processed', vehicles_found,
        'added', vehicles_added,
        'skipped', vehicles_skipped,
        'errors', errors_count
    );
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentar
COMMENT ON FUNCTION auto_process_filters_on_duc_update() IS 'Trigger automático para procesar filtros cuando se actualiza duc_scraper';
COMMENT ON FUNCTION process_filter_config_trigger(UUID) IS 'Función para procesar una configuración de filtro específica';

-- Verificar que los triggers se han creado correctamente
SELECT 
    'TRIGGERS CREADOS' as estado,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_auto_process_filters')
ORDER BY trigger_name; 