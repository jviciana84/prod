-- =====================================================
-- INSERTAR MANUALMENTE UNO DE LOS 23 VEHÍCULOS FALTANTES
-- =====================================================

-- 1. Seleccionar el primer vehículo faltante
WITH missing_vehicle AS (
    SELECT 
        d."Matrícula",
        d."Modelo",
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
    LIMIT 1
)
SELECT 
    'Vehículo a insertar: ' || "Matrícula" || ' - ' || "Modelo" as info,
    "Fecha compra DMS" as fecha_original,
    "Precio" as precio_original
FROM missing_vehicle;

-- 2. Intentar insertar el primer vehículo faltante
SELECT '=== INSERTANDO PRIMER VEHÍCULO FALTANTE ===' as info;
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
        ELSE NULL
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

-- 3. Verificar si se insertó
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

-- 4. Si funcionó, insertar los 22 restantes
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
        ELSE NULL
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

-- 5. Verificar resultado final
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

-- 6. Verificar que no quedan faltantes
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