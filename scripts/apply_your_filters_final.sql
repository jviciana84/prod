-- =====================================================
-- APLICAR TUS FILTROS CONFIGURADOS (VERSIÓN FINAL)
-- =====================================================

-- 1. Ver qué filtros tienes configurados
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

-- 3. Ver qué columnas tienes en duc_scraper para aplicar filtros
SELECT '=== COLUMNAS DISPONIBLES EN DUC_SCRAPER ===' as info;
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
ORDER BY ordinal_position;

-- 4. Ver algunos datos de ejemplo para entender los filtros
SELECT '=== DATOS DE EJEMPLO EN DUC_SCRAPER ===' as info;
SELECT 
    "Marca",
    "Disponibilidad",
    "Estado",
    COUNT(*) as cantidad
FROM duc_scraper 
GROUP BY "Marca", "Disponibilidad", "Estado"
ORDER BY cantidad DESC
LIMIT 10;

-- 5. Crear función que APLIQUE TUS FILTROS REALES
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
    RAISE NOTICE 'Iniciando procesamiento con TUS FILTROS REALES...';
    
    -- Procesar cada configuración activa con auto_process = true
    FOR config_record IN 
        SELECT * FROM filter_configs 
        WHERE is_active = true AND auto_process = true
    LOOP
        RAISE NOTICE 'Procesando configuración: %', config_record.name;
        
        -- AQUÍ APLICAR TUS FILTROS ESPECÍFICOS
        -- Basándome en tu configuración "Certificado disponibles"
        FOR vehicle_record IN 
            SELECT * FROM duc_scraper 
            WHERE 
                "Matrícula" IS NOT NULL  -- Con matrícula
                AND "Modelo" IS NOT NULL  -- Con modelo
                AND "Matrícula" != ''     -- Matrícula no vacía
                AND "Modelo" != ''        -- Modelo no vacío
                -- APLICAR TUS FILTROS ESPECÍFICOS AQUÍ
                -- Por ejemplo, si tu filtro es "Certificado disponibles":
                AND "Disponibilidad" = 'Disponible'  -- Solo disponibles
                -- Añadir más filtros según tu configuración
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
                    RAISE NOTICE 'Vehículo añadido: % - %', 
                        vehicle_record."Matrícula", vehicle_record."Modelo";
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

-- 6. Probar la función con TUS filtros
SELECT '=== PROCESANDO CON TUS FILTROS REALES ===' as info;
SELECT process_filter_configs(); 