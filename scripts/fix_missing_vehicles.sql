-- =====================================================
-- VER Y ARREGLAR LOS 23 VEHÍCULOS FALTANTES
-- =====================================================

-- 1. Ver los 23 vehículos específicos que no se insertaron
SELECT '=== LOS 23 VEHÍCULOS QUE NO SE INSERTARON ===' as info;
SELECT 
    d."ID Anuncio",
    d."Matrícula",
    d."Modelo",
    d."Marca",
    d."Disponibilidad",
    d."Estado",
    d."Fecha compra DMS",
    d."Precio"
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
ORDER BY d."Matrícula";

-- 2. Función para insertar SOLO los vehículos faltantes
CREATE OR REPLACE FUNCTION insert_missing_vehicles()
RETURNS void AS $$
DECLARE
    vehicle_record RECORD;
    new_entry_id UUID;
    added_count INTEGER := 0;
    error_count INTEGER := 0;
    converted_date DATE;
    converted_price NUMERIC;
BEGIN
    RAISE NOTICE 'Insertando vehículos faltantes...';
    
    FOR vehicle_record IN 
        SELECT * FROM duc_scraper d
        LEFT JOIN nuevas_entradas n ON d."Matrícula" = n.license_plate
        WHERE 
            d."Marca" IN ('BMW', 'MINI') 
            AND d."Disponibilidad" = 'DISPONIBLE'
            AND d."Matrícula" IS NOT NULL 
            AND d."Modelo" IS NOT NULL
            AND d."Matrícula" != ''
            AND d."Modelo" != ''
            AND n.license_plate IS NULL
    LOOP
        -- Convertir fecha
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
        
        -- Convertir precio
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
    END LOOP;
    
    RAISE NOTICE 'Procesamiento completado: % añadidos, % errores', added_count, error_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Ejecutar la función para insertar los faltantes
SELECT '=== INSERTANDO VEHÍCULOS FALTANTES ===' as info;
SELECT insert_missing_vehicles();

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

-- 5. Verificar que no quedan vehículos faltantes
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