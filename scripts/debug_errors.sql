-- =====================================================
-- DIAGNOSTICAR ERRORES Y OMITIDOS
-- =====================================================

-- 1. Ver vehículos que ya existen en nuevas_entradas (omitidos)
SELECT '=== VEHÍCULOS YA EXISTENTES (OMITIDOS) ===' as info;
SELECT 
    d."Matrícula",
    d."Modelo",
    d."Fecha compra DMS",
    d."Precio",
    n.created_at as fecha_existente
FROM duc_scraper d
INNER JOIN nuevas_entradas n ON d."Matrícula" = n.license_plate
ORDER BY n.created_at DESC
LIMIT 10;

-- 2. Ver vehículos con problemas de fecha
SELECT '=== VEHÍCULOS CON PROBLEMAS DE FECHA ===' as info;
SELECT 
    "Matrícula",
    "Modelo",
    "Fecha compra DMS",
    "Precio"
FROM duc_scraper 
WHERE 
    "Fecha compra DMS" IS NOT NULL 
    AND "Fecha compra DMS" != ''
    AND (
        "Fecha compra DMS" !~ '^\d{1,2}-\d{1,2}-\d{4}$'  -- No coincide con DD-MM-YYYY
        OR LENGTH("Fecha compra DMS") != 10  -- No tiene 10 caracteres
    )
LIMIT 10;

-- 3. Ver vehículos con problemas de precio
SELECT '=== VEHÍCULOS CON PROBLEMAS DE PRECIO ===' as info;
SELECT 
    "Matrícula",
    "Modelo",
    "Precio"
FROM duc_scraper 
WHERE 
    "Precio" IS NOT NULL 
    AND "Precio" != ''
    AND (
        "Precio" !~ '^\d+(\.\d+)?$'  -- No es un número válido
        OR "Precio"::numeric <= 0  -- Precio 0 o negativo
    )
LIMIT 10;

-- 4. Ver vehículos sin matrícula o modelo
SELECT '=== VEHÍCULOS SIN MATRÍCULA O MODELO ===' as info;
SELECT 
    "ID Anuncio",
    "Matrícula",
    "Modelo",
    "Marca"
FROM duc_scraper 
WHERE 
    "Matrícula" IS NULL 
    OR "Matrícula" = ''
    OR "Modelo" IS NULL 
    OR "Modelo" = ''
LIMIT 10;

-- 5. Crear función con mejor logging de errores
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
    filter_condition TEXT;
    converted_date DATE;
    converted_price NUMERIC;
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
                
                -- Convertir precio correctamente
                BEGIN
                    IF vehicle_record."Precio" IS NOT NULL AND vehicle_record."Precio" != '' THEN
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
                    RAISE NOTICE 'Vehículo añadido: % - % (fecha: %, precio: %)', 
                        vehicle_record."Matrícula", vehicle_record."Modelo", converted_date, converted_price;
                EXCEPTION WHEN OTHERS THEN
                    error_count := error_count + 1;
                    RAISE NOTICE 'Error insertando vehículo %: %', vehicle_record."Matrícula", SQLERRM;
                END;
            ELSE
                skipped_count := skipped_count + 1;
                RAISE NOTICE 'Vehículo ya existe: %', vehicle_record."Matrícula";
            END IF;
            
            processed_count := processed_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Procesamiento completado: % procesados, % añadidos, % saltados, % errores', 
        processed_count, added_count, skipped_count, error_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Probar la función mejorada
SELECT '=== PROBANDO FUNCIÓN MEJORADA ===' as info;
SELECT process_filter_configs(); 