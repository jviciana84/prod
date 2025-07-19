-- =====================================================
-- ARREGLAR NOT NULL EN PURCHASE_DATE
-- =====================================================

-- 1. Insertar el primer vehículo faltante con fecha por defecto
SELECT '=== INSERTANDO PRIMER VEHÍCULO FALTANTE (CON FECHA POR DEFECTO) ===' as info;
INSERT INTO nuevas_entradas (
    vehicle_type,
    license_plate,
    model,
    purchase_date,
    is_received,
    purchase_price
)
SELECT 
    'Coche',
    d."Matrícula",
    d."Modelo",
    CASE 
        WHEN d."Fecha compra DMS" IS NOT NULL 
             AND d."Fecha compra DMS" != '' 
             AND d."Fecha compra DMS" ~ '^\d{1,2}-\d{1,2}-\d{4}$' 
        THEN TO_DATE(d."Fecha compra DMS", 'DD-MM-YYYY')
        ELSE CURRENT_DATE  -- Usar fecha actual si no hay fecha válida
    END,
    false,
    CASE 
        WHEN d."Precio" IS NOT NULL 
             AND d."Precio" != '' 
             AND d."Precio" ~ '^\d+(\.\d+)?$' 
        THEN d."Precio"::numeric
        ELSE NULL
    END
FROM duc_scraper d
LEFT JOIN nuevas_entradas n ON d."Matrícula" = n.license_plate
WHERE 
    d."Marca" IN ('BMW', 'MINI') 
    AND d."Disponibilidad" = 'DISPONIBLE'
    AND d."Matrícula" IS NOT NULL 
    AND d."Modelo" IS NOT NULL
    AND d."Matrícula" != ''
    AND d."Modelo" != ''
    AND n.license_plate IS NULL
LIMIT 1;

-- 2. Verificar si se insertó
SELECT '=== VERIFICAR SI SE INSERTÓ ===' as info;
SELECT 
    'Vehículos faltantes después de insertar uno' as info,
    COUNT(*) as total
FROM duc_scraper d
LEFT JOIN nuevas_entradas n ON d."Matrícula" = n.license_plate
WHERE 
    d."Marca" IN ('BMW', 'MINI') 
    AND d."Disponibilidad" = 'DISPONIBLE'
    AND d."Matrícula" IS NOT NULL 
    AND d."Modelo" IS NOT NULL
    AND d."Matrícula" != ''
    AND d."Modelo" != ''
    AND n.license_plate IS NULL;

-- 3. Si funcionó, insertar los 22 restantes
SELECT '=== INSERTAR LOS 22 RESTANTES ===' as info;
INSERT INTO nuevas_entradas (
    vehicle_type,
    license_plate,
    model,
    purchase_date,
    is_received,
    purchase_price
)
SELECT 
    'Coche',
    d."Matrícula",
    d."Modelo",
    CASE 
        WHEN d."Fecha compra DMS" IS NOT NULL 
             AND d."Fecha compra DMS" != '' 
             AND d."Fecha compra DMS" ~ '^\d{1,2}-\d{1,2}-\d{4}$' 
        THEN TO_DATE(d."Fecha compra DMS", 'DD-MM-YYYY')
        ELSE CURRENT_DATE  -- Usar fecha actual si no hay fecha válida
    END,
    false,
    CASE 
        WHEN d."Precio" IS NOT NULL 
             AND d."Precio" != '' 
             AND d."Precio" ~ '^\d+(\.\d+)?$' 
        THEN d."Precio"::numeric
        ELSE NULL
    END
FROM duc_scraper d
LEFT JOIN nuevas_entradas n ON d."Matrícula" = n.license_plate
WHERE 
    d."Marca" IN ('BMW', 'MINI') 
    AND d."Disponibilidad" = 'DISPONIBLE'
    AND d."Matrícula" IS NOT NULL 
    AND d."Modelo" IS NOT NULL
    AND d."Matrícula" != ''
    AND d."Modelo" != ''
    AND n.license_plate IS NULL;

-- 4. Verificar resultado final
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

-- 5. Verificar que no quedan faltantes
SELECT '=== VERIFICAR QUE NO QUEDAN FALTANTES ===' as info;
SELECT 
    'Vehículos que aún faltan' as info,
    COUNT(*) as total
FROM duc_scraper d
LEFT JOIN nuevas_entradas n ON d."Matrícula" = n.license_plate
WHERE 
    d."Marca" IN ('BMW', 'MINI') 
    AND d."Disponibilidad" = 'DISPONIBLE'
    AND d."Matrícula" IS NOT NULL 
    AND d."Modelo" IS NOT NULL
    AND d."Matrícula" != ''
    AND d."Modelo" != ''
    AND n.license_plate IS NULL;

-- 6. Actualizar la función principal para usar fecha por defecto
SELECT '=== ACTUALIZAR FUNCIÓN PRINCIPAL ===' as info;
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
                -- Convertir fecha (usar fecha actual si no es válida)
                BEGIN
                    IF vehicle_record."Fecha compra DMS" IS NOT NULL 
                       AND vehicle_record."Fecha compra DMS" != '' 
                       AND vehicle_record."Fecha compra DMS" ~ '^\d{1,2}-\d{1,2}-\d{4}$' THEN
                        converted_date := TO_DATE(vehicle_record."Fecha compra DMS", 'DD-MM-YYYY');
                    ELSE
                        converted_date := CURRENT_DATE;  -- Fecha actual por defecto
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    converted_date := CURRENT_DATE;  -- Fecha actual por defecto
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
                        converted_date,  -- Ahora siempre tiene un valor
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