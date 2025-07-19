-- =====================================================
-- ARREGLAR FUNCIÓN RESPETANDO TUS FILTROS CONFIGURADOS
-- =====================================================

-- 1. Primero ver qué filtros tienes configurados
SELECT '=== TUS FILTROS CONFIGURADOS ===' as info;
SELECT 
    id,
    name,
    description,
    is_active,
    auto_process,
    created_at
FROM filter_configs 
WHERE is_active = true AND auto_process = true;

-- 2. Ver qué mapeos de columnas tienes activos
SELECT '=== TUS MAPEOS DE COLUMNAS ===' as info;
SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE is_active = true;

-- 3. Crear función que use TUS filtros, no los míos
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
BEGIN
    RAISE NOTICE 'Iniciando procesamiento de filtros...';
    
    -- Procesar cada configuración activa con auto_process = true
    FOR config_record IN 
        SELECT * FROM filter_configs 
        WHERE is_active = true AND auto_process = true
    LOOP
        RAISE NOTICE 'Procesando configuración: %', config_record.name;
        
        -- Aquí deberías aplicar TUS filtros específicos
        -- Por ahora, procesar todos los vehículos con matrícula y modelo
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
                    CASE 
                        WHEN vehicle_record."Fecha compra DMS" IS NOT NULL 
                        THEN vehicle_record."Fecha compra DMS"::date
                        ELSE NULL
                    END,
                    false,
                    CASE 
                        WHEN vehicle_record."Precio" IS NOT NULL 
                        THEN vehicle_record."Precio"::numeric
                        ELSE NULL
                    END
                ) RETURNING id INTO new_entry_id;
                
                added_count := added_count + 1;
                RAISE NOTICE 'Vehículo añadido: % - %', vehicle_record."Matrícula", vehicle_record."Modelo";
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

-- 4. Verificar que la función se creó
SELECT '=== FUNCIÓN CREADA ===' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- 5. Probar la función manualmente
SELECT '=== PROBANDO FUNCIÓN CON TUS FILTROS ===' as info;
SELECT process_filter_configs(); 