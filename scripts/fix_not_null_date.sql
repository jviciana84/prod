-- =====================================================
-- ARREGLAR RESTRICCIÓN NOT NULL EN PURCHASE_DATE
-- =====================================================

-- 1. Crear función que maneje fechas NULL
CREATE OR REPLACE FUNCTION process_filter_configs()
RETURNS void AS $$
DECLARE
    config_record RECORD;
    vehicle_record RECORD;
    new_entry_id UUID;
    processed_count INTEGER := 0;
    added_count INTEGER := 0;
    skipped_count INTEGER := 0;
    filter_condition TEXT;
    converted_date DATE;
BEGIN
    RAISE NOTICE 'Iniciando procesamiento de filtros...';
    
    -- Procesar cada configuración activa con auto_process = true
    FOR config_record IN 
        SELECT * FROM filter_configs 
        WHERE is_active = true AND auto_process = true
    LOOP
        RAISE NOTICE 'Procesando configuración: %', config_record.name;
        
        -- Procesar vehículos con matrícula y modelo
        FOR vehicle_record IN 
            SELECT * FROM duc_scraper 
            WHERE 
                "Matrícula" IS NOT NULL  -- Con matrícula
                AND "Modelo" IS NOT NULL  -- Con modelo
            LIMIT 50  -- Limitar para evitar sobrecarga
        LOOP
            -- Verificar si ya existe en nuevas_entradas
            IF NOT EXISTS (
                SELECT 1 FROM nuevas_entradas 
                WHERE license_plate = vehicle_record."Matrícula"
            ) THEN
                -- Convertir fecha correctamente
                BEGIN
                    IF vehicle_record."Fecha compra DMS" IS NOT NULL AND vehicle_record."Fecha compra DMS" != '' THEN
                        -- Intentar convertir fecha DD-MM-YYYY a YYYY-MM-DD
                        converted_date := TO_DATE(vehicle_record."Fecha compra DMS", 'DD-MM-YYYY');
                    ELSE
                        -- Usar fecha actual si no hay fecha válida
                        converted_date := CURRENT_DATE;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Error convirtiendo fecha "%" para matrícula %: %. Usando fecha actual.', 
                        vehicle_record."Fecha compra DMS", vehicle_record."Matrícula", SQLERRM;
                    converted_date := CURRENT_DATE;
                END;
                
                -- Insertar en nuevas_entradas
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
                    converted_date,  -- Ahora siempre tiene un valor
                    false,
                    CASE 
                        WHEN vehicle_record."Precio" IS NOT NULL AND vehicle_record."Precio" != ''
                        THEN vehicle_record."Precio"::numeric
                        ELSE NULL
                    END
                ) RETURNING id INTO new_entry_id;
                
                added_count := added_count + 1;
                RAISE NOTICE 'Vehículo añadido: % - % (fecha: %)', 
                    vehicle_record."Matrícula", vehicle_record."Modelo", converted_date;
            ELSE
                skipped_count := skipped_count + 1;
                RAISE NOTICE 'Vehículo ya existe: %', vehicle_record."Matrícula";
            END IF;
            
            processed_count := processed_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Procesamiento completado: % procesados, % añadidos, % saltados', 
        processed_count, added_count, skipped_count;
END;
$$ LANGUAGE plpgsql;

-- 2. Verificar que la función se creó
SELECT '=== FUNCIÓN CREADA ===' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- 3. Probar la función manualmente
SELECT '=== PROBANDO FUNCIÓN CON FECHA POR DEFECTO ===' as info;
SELECT process_filter_configs(); 