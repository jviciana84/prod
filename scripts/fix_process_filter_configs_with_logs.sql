-- =====================================================
-- ARREGLAR FUNCIÓN PROCESS_FILTER_CONFIGS CON LOGS
-- =====================================================
-- Implementa: Filtros web + Lógica de mapeo + Logs en scraper_logs
-- =====================================================

-- 1. Crear función que registre logs en scraper_logs
CREATE OR REPLACE FUNCTION process_filter_configs()
RETURNS void AS $$
DECLARE
    config_record RECORD;
    vehicle_record RECORD;
    new_entry_id UUID;
    processed_count INTEGER := 0;
    added_count INTEGER := 0;
    skipped_count INTEGER := 0;
    error_count INTEGER := 0;
    converted_date DATE;
    converted_price NUMERIC;
    combined_model TEXT;
    existing_count INTEGER;
    log_id UUID;
    log_message TEXT;
BEGIN
    -- Log inicial
    INSERT INTO scraper_logs (level, message, timestamp) 
    VALUES ('info', '🚀 Iniciando procesamiento automático de filtros...', NOW());
    
    -- Procesar cada configuración activa con auto_process = true
    FOR config_record IN 
        SELECT * FROM filter_configs 
        WHERE is_active = true AND auto_process = true
    LOOP
        log_message := '📋 Procesando configuración: ' || config_record.name;
        INSERT INTO scraper_logs (level, message, timestamp) 
        VALUES ('info', log_message, NOW());
        
        -- Crear log de procesamiento en filter_processing_log
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
        
        -- APLICAR FILTROS DE LA PÁGINA WEB (PRIORIDAD 1)
        FOR vehicle_record IN 
            SELECT * FROM duc_scraper 
            WHERE 
                -- Filtro de disponibilidad
                (config_record.disponibilidad_filter IS NULL OR 
                 config_record.disponibilidad_filter = '{}' OR 
                 "Disponibilidad" = ANY(config_record.disponibilidad_filter))
                
                -- Filtro de marca
                AND (config_record.marca_filter IS NULL OR 
                     config_record.marca_filter = '{}' OR 
                     "Marca" = ANY(config_record.marca_filter))
                
                -- Filtro de precio mínimo
                AND (config_record.precio_min IS NULL OR 
                     CASE 
                         WHEN "Precio" ~ '^[0-9]+$' 
                         THEN CAST("Precio" AS NUMERIC) >= config_record.precio_min
                         ELSE true
                     END)
                
                -- Filtro de precio máximo
                AND (config_record.precio_max IS NULL OR 
                     CASE 
                         WHEN "Precio" ~ '^[0-9]+$' 
                         THEN CAST("Precio" AS NUMERIC) <= config_record.precio_max
                         ELSE true
                     END)
                
                -- Filtro de km mínimo
                AND (config_record.km_min IS NULL OR 
                     CASE 
                         WHEN "KM" ~ '^[0-9]+$' 
                         THEN CAST("KM" AS INTEGER) >= config_record.km_min
                         ELSE true
                     END)
                
                -- Filtro de km máximo
                AND (config_record.km_max IS NULL OR 
                     CASE 
                         WHEN "KM" ~ '^[0-9]+$' 
                         THEN CAST("KM" AS INTEGER) <= config_record.km_max
                         ELSE true
                     END)
                
                -- Filtro de libre siniestros
                AND (config_record.libre_siniestros IS NULL OR 
                     "Libre de siniestros" = CASE 
                         WHEN config_record.libre_siniestros THEN 'Sí'
                         ELSE 'No'
                     END)
                
                -- Filtro de concesionario
                AND (config_record.concesionario_filter IS NULL OR 
                     config_record.concesionario_filter = '{}' OR 
                     "Concesionario" = ANY(config_record.concesionario_filter))
                
                -- Filtro de combustible
                AND (config_record.combustible_filter IS NULL OR 
                     config_record.combustible_filter = '{}' OR 
                     "Combustible" = ANY(config_record.combustible_filter))
                
                -- Filtro de año mínimo
                AND (config_record.año_min IS NULL OR 
                     CASE 
                         WHEN "Fecha fabricación" ~ '^[0-9]{4}$' 
                         THEN CAST("Fecha fabricación" AS INTEGER) >= config_record.año_min
                         ELSE true
                     END)
                
                -- Filtro de año máximo
                AND (config_record.año_max IS NULL OR 
                     CASE 
                         WHEN "Fecha fabricación" ~ '^[0-9]{4}$' 
                         THEN CAST("Fecha fabricación" AS INTEGER) <= config_record.año_max
                         ELSE true
                     END)
                
                -- Filtro de días stock mínimo
                AND (config_record.dias_stock_min IS NULL OR 
                     CASE 
                         WHEN "Días stock" ~ '^[0-9]+$' 
                         THEN CAST("Días stock" AS INTEGER) >= config_record.dias_stock_min
                         ELSE true
                     END)
                
                -- Filtro de días stock máximo
                AND (config_record.dias_stock_max IS NULL OR 
                     CASE 
                         WHEN "Días stock" ~ '^[0-9]+$' 
                         THEN CAST("Días stock" AS INTEGER) <= config_record.dias_stock_max
                         ELSE true
                     END)
                
                -- Campos obligatorios
                AND "Matrícula" IS NOT NULL 
                AND "Matrícula" != ''
                AND "Modelo" IS NOT NULL 
                AND "Modelo" != ''
                
            LIMIT config_record.max_vehicles_per_batch
        LOOP
            processed_count := processed_count + 1;
            
            -- VERIFICAR DUPLICADOS POR MATRÍCULA (PRIORIDAD 2)
            SELECT COUNT(*) INTO existing_count 
            FROM nuevas_entradas 
            WHERE license_plate = vehicle_record."Matrícula";
            
            IF existing_count > 0 THEN
                skipped_count := skipped_count + 1;
                log_message := '⏭️ Duplicado saltado: ' || vehicle_record."Matrícula" || ' (matrícula ya existe)';
                INSERT INTO scraper_logs (level, message, timestamp) 
                VALUES ('warning', log_message, NOW());
                CONTINUE;
            END IF;
            
            -- LÓGICA DE MAPEO ESPECÍFICA (PRIORIDAD 2)
            
            -- 1. LÓGICA HARDCODEADA: Modelo + Versión → model (combinados)
            combined_model := COALESCE(vehicle_record."Modelo", '');
            IF vehicle_record."Versión" IS NOT NULL AND vehicle_record."Versión" != '' THEN
                combined_model := combined_model || ' ' || vehicle_record."Versión";
            END IF;
            
            -- 2. CONVERTIR FECHA DE COMPRA
            converted_date := NULL;
            IF vehicle_record."Fecha compra DMS" IS NOT NULL AND vehicle_record."Fecha compra DMS" != '' THEN
                BEGIN
                    -- Intentar diferentes formatos de fecha
                    IF vehicle_record."Fecha compra DMS" ~ '^[0-9]{2}-[0-9]{2}-[0-9]{4}$' THEN
                        converted_date := vehicle_record."Fecha compra DMS"::DATE;
                    ELSIF vehicle_record."Fecha compra DMS" ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN
                        converted_date := TO_DATE(vehicle_record."Fecha compra DMS", 'DD/MM/YYYY');
                    ELSIF vehicle_record."Fecha compra DMS" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
                        converted_date := vehicle_record."Fecha compra DMS"::DATE;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    converted_date := NULL;
                    log_message := '⚠️ Error convirtiendo fecha: ' || vehicle_record."Fecha compra DMS";
                    INSERT INTO scraper_logs (level, message, timestamp) 
                    VALUES ('warning', log_message, NOW());
                END;
            END IF;
            
            -- 3. CONVERTIR PRECIO DE COMPRA
            converted_price := NULL;
            IF vehicle_record."Precio compra" IS NOT NULL AND vehicle_record."Precio compra" != '' THEN
                BEGIN
                    converted_price := CAST(REPLACE(REPLACE(vehicle_record."Precio compra", '€', ''), '.', '') AS NUMERIC);
                EXCEPTION WHEN OTHERS THEN
                    converted_price := NULL;
                    log_message := '⚠️ Error convirtiendo precio: ' || vehicle_record."Precio compra";
                    INSERT INTO scraper_logs (level, message, timestamp) 
                    VALUES ('warning', log_message, NOW());
                END;
            END IF;
            
            -- 4. INSERTAR EN NUEVAS_ENTRADAS CON MAPEO CORRECTO
            BEGIN
                INSERT INTO nuevas_entradas (
                    -- MAPEOS DE LA WEB (PRIORIDAD 2)
                    license_plate,           -- "Matrícula" → license_plate
                    model,                   -- Modelo + Versión combinados
                    purchase_date_duc,       -- "Fecha compra DMS" → purchase_date_duc
                    
                    -- CAMPOS ADICIONALES DEL DUC
                    purchase_price,          -- "Precio compra" convertido
                    origin,                  -- "Origen"
                    origin_details,          -- "Origenes unificados"
                    duc_id_anuncio,          -- "ID Anuncio"
                    duc_import_date,         -- import_date
                    duc_last_seen,           -- last_seen_date
                    
                    -- CAMPOS POR DEFECTO
                    vehicle_type,
                    is_received,
                    status,
                    entry_date
                ) VALUES (
                    vehicle_record."Matrícula",
                    combined_model,
                    converted_date,
                    converted_price,
                    vehicle_record."Origen",
                    vehicle_record."Origenes unificados",
                    vehicle_record."ID Anuncio",
                    vehicle_record.import_date,
                    vehicle_record.last_seen_date,
                    'Coche',
                    false,
                    'pendiente',
                    NOW()
                );
                
                added_count := added_count + 1;
                log_message := '✅ Añadido: ' || vehicle_record."Matrícula" || ' - ' || combined_model || 
                              ' (Precio: ' || COALESCE(converted_price::TEXT, '0') || '€, Origen: ' || 
                              COALESCE(vehicle_record."Origen", 'N/A') || ')';
                INSERT INTO scraper_logs (level, message, timestamp) 
                VALUES ('success', log_message, NOW());
                    
            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                log_message := '❌ Error insertando ' || vehicle_record."Matrícula" || ': ' || SQLERRM;
                INSERT INTO scraper_logs (level, message, timestamp) 
                VALUES ('error', log_message, NOW());
            END;
        END LOOP;
        
        -- Log de resumen de configuración
        log_message := '✅ Configuración ' || config_record.name || ' completada: ' || 
                      processed_count || ' procesados, ' || added_count || ' añadidos, ' || 
                      skipped_count || ' saltados, ' || error_count || ' errores';
        INSERT INTO scraper_logs (level, message, timestamp) 
        VALUES ('info', log_message, NOW());
        
        -- Actualizar log con resultados en filter_processing_log
        UPDATE filter_processing_log 
        SET 
            status = 'completed',
            total_vehicles_found = processed_count,
            vehicles_processed = processed_count,
            vehicles_added_to_nuevas_entradas = added_count,
            vehicles_skipped = skipped_count,
            errors_count = error_count,
            completed_at = NOW()
        WHERE id = log_id;
        
        -- Actualizar last_used_at en la configuración
        UPDATE filter_configs 
        SET last_used_at = NOW() 
        WHERE id = config_record.id;
    END LOOP;
    
    -- Log final
    INSERT INTO scraper_logs (level, message, timestamp) 
    VALUES ('info', '🎉 Procesamiento automático completado', NOW());
END;
$$ LANGUAGE plpgsql;

-- 2. Verificar que la función se creó correctamente
SELECT '=== FUNCIÓN CREADA CON LOGS ===' as info;
SELECT 
    routine_name,
    routine_type,
    routine_definition IS NOT NULL as tiene_definicion
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- 3. Verificar que el trigger llama a la función correcta
SELECT '=== TRIGGER VERIFICADO ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper'
AND trigger_name = 'trigger_auto_process_filters';

-- 4. Comentarios para documentar
COMMENT ON FUNCTION process_filter_configs() IS 'Función que procesa filtros web + lógica de mapeo + registra logs en scraper_logs para mostrar en consola'; 