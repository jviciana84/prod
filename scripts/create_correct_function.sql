-- =====================================================
-- CREAR FUNCIÓN CORRECTA CON COLUMNAS REALES
-- =====================================================

-- 1. Crear función que procese filtros automáticamente
CREATE OR REPLACE FUNCTION process_filter_configs()
RETURNS void AS $$
DECLARE
    config_record RECORD;
    vehicle_record RECORD;
    new_entry_id UUID;
    processed_count INTEGER := 0;
    added_count INTEGER := 0;
    skipped_count INTEGER := 0;
BEGIN
    -- Procesar cada configuración activa con auto_process = true
    FOR config_record IN 
        SELECT * FROM filter_configs 
        WHERE is_active = true AND auto_process = true
    LOOP
        RAISE NOTICE 'Procesando configuración: %', config_record.name;
        
        -- Procesar vehículos que cumplan los filtros
        FOR vehicle_record IN 
            SELECT * FROM duc_scraper 
            WHERE 
                -- Filtros básicos (ajustar según tu configuración)
                "Marca" = 'BMW'  -- Ejemplo: solo BMW
                AND "Disponibilidad" = 'Disponible'  -- Ejemplo: solo disponibles
            LIMIT 50  -- Limitar para evitar sobrecarga
        LOOP
            -- Verificar si ya existe en nuevas_entradas
            IF NOT EXISTS (
                SELECT 1 FROM nuevas_entradas 
                WHERE license_plate = vehicle_record."Matrícula"
            ) THEN
                -- Insertar en nuevas_entradas con columnas reales
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
SELECT '=== PROBANDO FUNCIÓN ===' as info;
SELECT process_filter_configs(); 