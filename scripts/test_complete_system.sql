-- =====================================================
-- PROBAR SISTEMA COMPLETO DESDE CERO
-- =====================================================

-- 1. Verificar que la tabla está vacía
SELECT '=== VERIFICAR TABLA VACÍA ===' as info;
SELECT COUNT(*) as total_vehicles FROM nuevas_entradas;

-- 2. Verificar que purchase_date permite NULL
SELECT '=== VERIFICAR PURCHASE_DATE PERMITE NULL ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas' 
    AND column_name = 'purchase_date';

-- 3. Verificar datos disponibles en duc_scraper
SELECT '=== DATOS DISPONIBLES EN DUC_SCRAPER ===' as info;
SELECT 
    'Total vehículos en duc_scraper' as info,
    COUNT(*) as total
FROM duc_scraper
UNION ALL
SELECT 
    'BMW disponibles' as info,
    COUNT(*) as total
FROM duc_scraper 
WHERE "Marca" = 'BMW' AND "Disponibilidad" = 'DISPONIBLE'
UNION ALL
SELECT 
    'MINI disponibles' as info,
    COUNT(*) as total
FROM duc_scraper 
WHERE "Marca" = 'MINI' AND "Disponibilidad" = 'DISPONIBLE'
UNION ALL
SELECT 
    'BMW + MINI disponibles' as info,
    COUNT(*) as total
FROM duc_scraper 
WHERE "Marca" IN ('BMW', 'MINI') AND "Disponibilidad" = 'DISPONIBLE';

-- 4. Ejecutar la función principal para procesar todos los vehículos
SELECT '=== EJECUTAR FUNCIÓN PRINCIPAL ===' as info;
SELECT process_filter_configs();

-- 5. Verificar resultado después del procesamiento
SELECT '=== RESULTADO DESPUÉS DEL PROCESAMIENTO ===' as info;
SELECT 
    'Vehículos procesados en nuevas_entradas' as info,
    COUNT(*) as total
FROM nuevas_entradas
UNION ALL
SELECT 
    'Con fecha de compra' as info,
    COUNT(*) as total
FROM nuevas_entradas
WHERE purchase_date IS NOT NULL
UNION ALL
SELECT 
    'Sin fecha de compra (NULL)' as info,
    COUNT(*) as total
FROM nuevas_entradas
WHERE purchase_date IS NULL;

-- 6. Mostrar algunos ejemplos de vehículos procesados
SELECT '=== EJEMPLOS DE VEHÍCULOS PROCESADOS ===' as info;
SELECT 
    license_plate,
    model,
    purchase_date,
    purchase_price,
    CASE 
        WHEN purchase_date IS NULL THEN 'SIN FECHA - COMPLETAR MANUALMENTE'
        ELSE 'CON FECHA'
    END as status
FROM nuevas_entradas 
ORDER BY 
    CASE WHEN purchase_date IS NULL THEN 0 ELSE 1 END,
    license_plate
LIMIT 15;

-- 7. Verificar que no quedan faltantes
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

-- 8. Mostrar vehículos que faltan (si los hay)
SELECT '=== VEHÍCULOS QUE FALTAN (SI LOS HAY) ===' as info;
SELECT 
    d."Matrícula",
    d."Modelo",
    d."Marca",
    d."Disponibilidad",
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
    AND n.license_plate IS NULL; 