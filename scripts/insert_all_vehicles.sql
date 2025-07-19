-- =====================================================
-- INSERTAR TODOS LOS VEHÍCULOS (SIN RESTRICCIONES)
-- =====================================================

-- 1. Crear función que inserte todos los vehículos
CREATE OR REPLACE FUNCTION process_filter_configs()
RETURNS void AS $$
DECLARE
    config_record RECORD;
    vehicle_record RECORD;
    new_entry_id UUID;
    processed_count INTEGER := 0;
    added_count INTEGER := 0;
    error_count INTEGER := 0;
    converted_date DATE;
    converted_price NUMERIC;
BEGIN
    RAISE NOTICE 'Iniciando procesamiento de TODOS los vehículos...';
    
    -- Procesar cada configuración activa con auto_process = true
    FOR config_record IN 
        SELECT * FROM filter_configs 
        WHERE is_active = true AND auto_process = true
    LOOP
        RAISE NOTICE 'Procesando configuración: %', config_record.name;
        
        -- Procesar TODOS los vehículos con matrícula y modelo
        FOR vehicle_record IN 
            SELECT * FROM duc_scraper 
            WHERE 
                "Matrícula" IS NOT NULL  -- Con matrícula
                AND "Modelo" IS NOT NULL  -- Con modelo
                AND "Matrícula" != ''     -- Matrícula no vacía
                AND "Modelo" != ''        -- Modelo no vacío
        LOOP
            -- Convertir fecha (permitir NULL si no es válida)
            BEGIN
                IF vehicle_record."Fecha compra DMS" IS NOT NULL 
                   AND vehicle_record."Fecha compra DMS" != '' 
                   AND vehicle_record."Fecha compra DMS" ~ '^\d{1,2}-\d{1,2}-\d{4}$' THEN
                    -- Intentar convertir fecha DD-MM-YYYY a YYYY-MM-DD
                    converted_date := TO_DATE(vehicle_record."Fecha compra DMS", 'DD-MM-YYYY');
                ELSE
                    -- No hay fecha válida, usar NULL
                    converted_date := NULL;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error convirtiendo fecha "%" para matrícula %: %. Usando NULL.', 
                    vehicle_record."Fecha compra DMS", vehicle_record."Matrícula", SQLERRM;
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
                RAISE NOTICE 'Error convirtiendo precio "%" para matrícula %: %. Usando NULL.', 
                    vehicle_record."Precio", vehicle_record."Matrícula", SQLERRM;
                converted_price := NULL;
            END;
            
            -- Insertar en nuevas_entradas (permitir NULL en fecha y precio)
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
                    converted_date,  -- Puede ser NULL
                    false,
                    converted_price  -- Puede ser NULL
                ) RETURNING id INTO new_entry_id;
                
                added_count := added_count + 1;
                RAISE NOTICE 'Vehículo añadido: % - % (fecha: %, precio: %)', 
                    vehicle_record."Matrícula", vehicle_record."Modelo", 
                    COALESCE(converted_date::TEXT, 'NULL'), 
                    COALESCE(converted_price::TEXT, 'NULL');
            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE 'Error insertando vehículo %: %', vehicle_record."Matrícula", SQLERRM;
            END;
            
            processed_count := processed_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Procesamiento completado: % procesados, % añadidos, % errores', 
        processed_count, added_count, error_count;
END;
$$ LANGUAGE plpgsql;

-- 2. Verificar que la función se creó
SELECT '=== FUNCIÓN CREADA ===' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- 3. Probar la función (insertar todos los vehículos)
SELECT '=== INSERTANDO TODOS LOS VEHÍCULOS ===' as info;
SELECT process_filter_configs();

-- 4. Verificar resultado
SELECT '=== RESULTADO FINAL ===' as info;
SELECT 
    'Vehículos en duc_scraper' as tabla,
    COUNT(*) as total
FROM duc_scraper 
WHERE "Matrícula" IS NOT NULL AND "Modelo" IS NOT NULL
UNION ALL
SELECT 
    'Vehículos en nuevas_entradas' as tabla,
    COUNT(*) as total
FROM nuevas_entradas; 