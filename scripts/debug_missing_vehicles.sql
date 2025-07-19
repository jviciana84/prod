-- =====================================================
-- DIAGNOSTICAR LOS 23 VEHÍCULOS FALTANTES
-- =====================================================

-- 1. Ver exactamente cuáles son los 23 vehículos que faltan
SELECT '=== LOS 23 VEHÍCULOS FALTANTES ===' as info;
SELECT 
    d."ID Anuncio",
    d."Matrícula",
    d."Modelo",
    d."Marca",
    d."Disponibilidad",
    d."Estado",
    d."Fecha compra DMS",
    d."Precio",
    LENGTH(d."Matrícula") as longitud_matricula,
    LENGTH(d."Modelo") as longitud_modelo
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

-- 2. Intentar insertar UNO de los vehículos faltantes para ver el error
SELECT '=== INTENTAR INSERTAR UN VEHÍCULO FALTANTE ===' as info;
-- Seleccionar el primer vehículo faltante
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
    'Intentando insertar: ' || "Matrícula" || ' - ' || "Modelo" as info,
    "Fecha compra DMS" as fecha_original,
    "Precio" as precio_original
FROM missing_vehicle;

-- 3. Verificar si hay problemas con las columnas de nuevas_entradas
SELECT '=== VERIFICAR ESTRUCTURA DE NUEVAS_ENTRADAS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas' 
ORDER BY ordinal_position;

-- 4. Verificar si hay restricciones únicas que puedan estar causando problemas
SELECT '=== VERIFICAR RESTRICCIONES ÚNICAS ===' as info;
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'nuevas_entradas';

-- 5. Intentar insertar manualmente un vehículo de prueba
SELECT '=== INSERTAR MANUALMENTE UN VEHÍCULO DE PRUEBA ===' as info;
INSERT INTO nuevas_entradas (
    vehicle_type,
    license_plate,
    model,
    purchase_date,
    is_received,
    purchase_price
) VALUES (
    'Coche',
    'TEST-123',
    'Modelo Test',
    CURRENT_DATE,
    false,
    50000
) ON CONFLICT DO NOTHING;

-- Verificar si se insertó
SELECT 
    'Vehículo de prueba insertado' as info,
    COUNT(*) as total
FROM nuevas_entradas 
WHERE license_plate = 'TEST-123';

-- Limpiar el vehículo de prueba
DELETE FROM nuevas_entradas WHERE license_plate = 'TEST-123'; 