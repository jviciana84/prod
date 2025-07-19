-- =====================================================
-- VER VEHÍCULOS RECHAZADOS Y POR QUÉ
-- =====================================================

-- 1. Vehículos que cumplen los filtros pero NO están en nuevas_entradas
SELECT '=== VEHÍCULOS RECHAZADOS (CUMPLEN FILTROS PERO NO ESTÁN EN NUEVAS_ENTRADAS) ===' as info;
SELECT 
    d."ID Anuncio",
    d."Matrícula",
    d."Modelo",
    d."Marca",
    d."Disponibilidad",
    d."Estado",
    d."Fecha compra DMS",
    d."Precio",
    'Cumple filtros pero no está en nuevas_entradas' as motivo
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

-- 2. Vehículos que NO cumplen los filtros (explicación de por qué no se procesan)
SELECT '=== VEHÍCULOS QUE NO CUMPLEN TUS FILTROS ===' as info;
SELECT 
    d."ID Anuncio",
    d."Matrícula",
    d."Modelo",
    d."Marca",
    d."Disponibilidad",
    d."Estado",
    CASE 
        WHEN d."Marca" NOT IN ('BMW', 'MINI') THEN 'Marca no permitida: ' || d."Marca"
        WHEN d."Disponibilidad" != 'DISPONIBLE' THEN 'No disponible: ' || d."Disponibilidad"
        WHEN d."Matrícula" IS NULL OR d."Matrícula" = '' THEN 'Sin matrícula'
        WHEN d."Modelo" IS NULL OR d."Modelo" = '' THEN 'Sin modelo'
        ELSE 'Otro motivo'
    END as motivo_rechazo
FROM duc_scraper d
WHERE 
    NOT (
        d."Marca" IN ('BMW', 'MINI') 
        AND d."Disponibilidad" = 'DISPONIBLE'
        AND d."Matrícula" IS NOT NULL 
        AND d."Modelo" IS NOT NULL
        AND d."Matrícula" != ''
        AND d."Modelo" != ''
    )
ORDER BY d."Marca", d."Disponibilidad";

-- 3. Resumen de rechazos
SELECT '=== RESUMEN DE RECHAZOS ===' as info;
SELECT 
    'Vehículos que cumplen filtros pero no están en nuevas_entradas' as tipo,
    COUNT(*) as cantidad
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

UNION ALL

SELECT 
    'Vehículos que NO cumplen filtros (marca no permitida)' as tipo,
    COUNT(*) as cantidad
FROM duc_scraper d
WHERE d."Marca" NOT IN ('BMW', 'MINI')

UNION ALL

SELECT 
    'Vehículos que NO cumplen filtros (no disponibles)' as tipo,
    COUNT(*) as cantidad
FROM duc_scraper d
WHERE 
    d."Marca" IN ('BMW', 'MINI') 
    AND d."Disponibilidad" != 'DISPONIBLE'

UNION ALL

SELECT 
    'Vehículos que NO cumplen filtros (sin matrícula/modelo)' as tipo,
    COUNT(*) as cantidad
FROM duc_scraper d
WHERE 
    d."Marca" IN ('BMW', 'MINI') 
    AND d."Disponibilidad" = 'DISPONIBLE'
    AND (d."Matrícula" IS NULL OR d."Matrícula" = '' OR d."Modelo" IS NULL OR d."Modelo" = ''); 