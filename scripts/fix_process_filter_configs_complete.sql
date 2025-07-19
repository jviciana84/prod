-- =====================================================
-- ARREGLAR FUNCIÓN PROCESS_FILTER_CONFIGS COMPLETA
-- =====================================================
-- Implementa: Filtros de página web + Lógica de mapeo específica
-- =====================================================

-- 1. Crear función completa que implemente la lógica correcta
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
BEGIN
    RAISE NOTICE '🚀 Iniciando procesamiento con filtros web + lógica de mapeo...';
    
    -- Procesar cada configuración activa con auto_process = true
    FOR config_record IN 
        SELECT * FROM filter_configs 
        WHERE is_active = true AND auto_process = true
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
                RAISE NOTICE '⏭️ Duplicado saltado: % (matrícula ya existe)', vehicle_record."Matrícula";
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
                    RAISE NOTICE '⚠️ Error convirtiendo fecha: %', vehicle_record."Fecha compra DMS";
                END;
            END IF;
            
            -- 3. CONVERTIR PRECIO DE COMPRA
            converted_price := NULL;
            IF vehicle_record."Precio compra" IS NOT NULL AND vehicle_record."Precio compra" != '' THEN
                BEGIN
                    converted_price := CAST(REPLACE(REPLACE(vehicle_record."Precio compra", '€', ''), '.', '') AS NUMERIC);
                EXCEPTION WHEN OTHERS THEN
                    converted_price := NULL;
                    RAISE NOTICE '⚠️ Error convirtiendo precio: %', vehicle_record."Precio compra";
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
                RAISE NOTICE '✅ Añadido: % - % (Precio: %€, Origen: %)', 
                    vehicle_record."Matrícula", 
                    combined_model,
                    COALESCE(converted_price, 0),
                    COALESCE(vehicle_record."Origen", 'N/A');
                    
            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE '❌ Error insertando %: %', vehicle_record."Matrícula", SQLERRM;
            END;
        END LOOP;
        
        -- Actualizar log con resultados
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
        
        RAISE NOTICE '✅ Configuración % completada: % procesados, % añadidos, % saltados, % errores', 
            config_record.name, processed_count, added_count, skipped_count, error_count;
    END LOOP;
    
    RAISE NOTICE '🎉 Procesamiento completado';
END;
$$ LANGUAGE plpgsql;

-- 2. Verificar que la función se creó correctamente
SELECT '=== FUNCIÓN CREADA ===' as info;
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

-- 4. Estado final del sistema
SELECT '=== ESTADO FINAL ===' as info;
WITH summary AS (
    SELECT 
        (SELECT COUNT(*) FROM filter_configs WHERE is_active = true AND auto_process = true) as configs_activas_auto,
        (SELECT COUNT(*) FROM column_mappings WHERE is_active = true AND duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')) as mapeos_basicos_activos,
        (SELECT COUNT(*) FROM duc_scraper) as registros_duc,
        (SELECT COUNT(*) FROM nuevas_entradas) as registros_nuevas_entradas,
        (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'duc_scraper' AND trigger_name = 'trigger_auto_process_filters') as trigger_activo
)
SELECT 
    'CONFIGURACIONES CON AUTO_PROCESS' as item,
    configs_activas_auto as valor,
    CASE 
        WHEN configs_activas_auto > 0 THEN '✅ OK - Configuración activa'
        ELSE '❌ PROBLEMA: No hay configuración activa'
    END as estado
FROM summary
UNION ALL
SELECT 
    'MAPEOS BÁSICOS ACTIVOS' as item,
    mapeos_basicos_activos as valor,
    CASE 
        WHEN mapeos_basicos_activos >= 3 THEN '✅ OK - Mapeos configurados'
        ELSE '❌ PROBLEMA: Faltan mapeos básicos'
    END as estado
FROM summary
UNION ALL
SELECT 
    'REGISTROS EN DUC_SCRAPER' as item,
    registros_duc as valor,
    CASE 
        WHEN registros_duc > 0 THEN '✅ OK - Hay datos para procesar'
        ELSE '⚠️ AVISO: No hay datos en duc_scraper'
    END as estado
FROM summary
UNION ALL
SELECT 
    'REGISTROS EN NUEVAS_ENTRADAS' as item,
    registros_nuevas_entradas as valor,
    '📊 Estado actual' as estado
FROM summary
UNION ALL
SELECT 
    'TRIGGER AUTOMÁTICO' as item,
    trigger_activo as valor,
    CASE 
        WHEN trigger_activo > 0 THEN '✅ OK - Trigger activo'
        ELSE '❌ PROBLEMA: Trigger no activo'
    END as estado
FROM summary;

-- 5. Comentarios para documentar
COMMENT ON FUNCTION process_filter_configs() IS 'Función que procesa filtros web + lógica de mapeo específica: 1) Aplica filtros de filter_configs, 2) Combina Modelo+Versión, 3) Mapea columnas específicas, 4) Maneja duplicados por matrícula'; 