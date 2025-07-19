-- =====================================================
-- FUNCIÓN CON TUS FILTROS CORRECTOS
-- =====================================================

-- Crear función que use TUS filtros reales
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
BEGIN
    RAISE NOTICE 'Iniciando procesamiento con TUS FILTROS CORRECTOS...';
    
    -- Procesar cada configuración activa con auto_process = true
    FOR config_record IN 
        SELECT * FROM filter_configs 
        WHERE is_active = true AND auto_process = true
    LOOP
        RAISE NOTICE 'Procesando configuración: %', config_record.name;
        
        -- APLICAR TUS FILTROS CORRECTOS
        -- "Certificado disponibles" = Solo BMW y MINI disponibles
        FOR vehicle_record IN 
            SELECT * FROM duc_scraper 
            WHERE 
                "Matrícula" IS NOT NULL  -- Con matrícula
                AND "Modelo" IS NOT NULL  -- Con modelo
                AND "Matrícula" != ''     -- Matrícula no vacía
                AND "Modelo" != ''        -- Modelo no vacío
                -- TUS FILTROS ESPECÍFICOS:
                AND "Marca" IN ('BMW', 'MINI')  -- Solo BMW y MINI
                AND "Disponibilidad" = 'DISPONIBLE'  -- Solo disponibles
                -- Estado puede ser cualquiera (KM0 o Vehículo usado)
        LOOP
            -- Verificar si ya existe la matrícula
            IF NOT EXISTS (
                SELECT 1 FROM nuevas_entradas 
                WHERE license_plate = vehicle_record."Matrícula"
            ) THEN
                -- Convertir fecha (permitir NULL si no es válida)
                BEGIN
                    IF vehicle_record."Fecha compra DMS" IS NOT NULL 
                       AND vehicle_record."Fecha compra DMS" != '' 
                       AND vehicle_record."Fecha compra DMS" ~ '^\d{1,2}-\d{1,2}-\d{4}$' THEN
                        converted_date := TO_DATE(vehicle_record."Fecha compra DMS", 'DD-MM-YYYY');
                    ELSE
                        converted_date := NULL;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    converted_date := NULL;
                END;
                
                -- Convertir precio (permitir NULL si no es válido)
                BEGIN
                    IF vehicle_record."Precio" IS NOT NULL 
                       AND vehicle_record."Precio" != '' 
                       AND vehicle_record."Precio" ~ '^\d+(\.\d+)?$' THEN
                        converted_price := vehicle_record."Precio"::numeric;
                        IF converted_price <= 0 THEN
                            converted_price := NULL;
                        END IF;
                    ELSE
                        converted_price := NULL;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    converted_price := NULL;
                END;
                
                -- Insertar en nuevas_entradas
                BEGIN
                    INSERT INTO nuevas_entradas (
                        vehicle_type,
                        license_plate,
                        model,
                        purchase_date,
                        is_received,
                        purchase_price
                    ) VALUES (
                        'Coche',
                        vehicle_record."Matrícula",
                        vehicle_record."Modelo",
                        converted_date,
                        false,
                        converted_price
                    ) RETURNING id INTO new_entry_id;
                    
                    added_count := added_count + 1;
                    RAISE NOTICE 'Vehículo añadido: % - % (%s)', 
                        vehicle_record."Matrícula", vehicle_record."Modelo", vehicle_record."Marca";
                EXCEPTION WHEN OTHERS THEN
                    error_count := error_count + 1;
                    RAISE NOTICE 'Error insertando vehículo %: %', vehicle_record."Matrícula", SQLERRM;
                END;
            ELSE
                skipped_count := skipped_count + 1;
            END IF;
            
            processed_count := processed_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Procesamiento completado: % procesados, % añadidos, % saltados, % errores', 
        processed_count, added_count, skipped_count, error_count;
END;
$$ LANGUAGE plpgsql;

-- Verificar que la función se creó
SELECT '=== FUNCIÓN CREADA ===' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- Probar la función con TUS filtros correctos
SELECT '=== PROCESANDO CON TUS FILTROS CORRECTOS ===' as info;
SELECT process_filter_configs();

-- Verificar resultado
SELECT '=== RESULTADO FINAL ===' as info;
SELECT 
    'Vehículos BMW/MINI disponibles en duc_scraper' as info,
    COUNT(*) as total
FROM duc_scraper 
WHERE "Marca" IN ('BMW', 'MINI') AND "Disponibilidad" = 'DISPONIBLE'
UNION ALL
SELECT 
    'Vehículos en nuevas_entradas' as info,
    COUNT(*) as total
FROM nuevas_entradas; 