-- =====================================================
-- IDENTIFICAR COLUMNAS FALTANTES EN DUC_SCRAPER
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Comparar la tabla duc_scraper actual con las 95 columnas del Excel
-- =====================================================

-- 1. Verificar cuántas columnas tiene actualmente la tabla
SELECT 
    'COLUMNAS ACTUALES' as tipo,
    COUNT(*) as cantidad
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'

UNION ALL

SELECT 
    'COLUMNAS ESPERADAS' as tipo,
    95 as cantidad;

-- 2. Mostrar todas las columnas que tiene actualmente la tabla
SELECT 
    'COLUMNAS EXISTENTES' as estado,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Definir las 95 columnas que debería tener (según el Excel)
WITH columnas_esperadas AS (
    SELECT unnest(ARRAY[
        'ID Anuncio', 'Anuncio', 'BPS / NEXT', 'Cambio', 'Certificado', 'Chasis', 
        'Color Carrocería', 'Color tapizado', 'Combustible', 'Concesionario', 
        'Creado con', 'Destino', 'Disponibilidad', 'Distintivo ambiental', 
        'Días creado', 'Días desde compra DMS', 'Días desde matriculación', 
        'Días publicado', 'e-code', 'El precio es', 'En uso', 'Fecha compra DMS', 
        'Fecha creación', 'Fecha disponibilidad', 'Fecha entrada VO', 
        'Fecha fabricación', 'Fecha modificación', 'Fecha primera matriculación', 
        'Fecha primera publicación', 'Garantía', 'KM', 'Libre de siniestros', 
        'Marca', 'Moneda', 'No completados', 'Nota interna', 'Observaciones', 
        'Origen', 'Origenes unificados', 'País origen', 'Potencia Cv', 'Precio', 
        'Precio compra', 'Precio cuota alquiler', 'Precio cuota renting', 
        'Precio estimado medio', 'Precio exportación', 'Precio financiado', 
        'Precio vehículo nuevo', 'Precio profesional', 'Proveedor', 'Referencia', 
        'Referencia interna', 'Regimen fiscal', 'Tienda', 'Tipo de distribución', 
        'Tipo motor', 'Trancha 1', 'Trancha 2', 'Trancha 3', 'Trancha 4', 
        'Trancha Combustible', 'Trancha YUC', 'Ubicación tienda', 'URL', 
        'URL foto 1', 'URL foto 2', 'URL foto 3', 'URL foto 4', 'URL foto 5', 
        'URL foto 6', 'URL foto 7', 'URL foto 8', 'URL foto 9', 'URL foto 10', 
        'URL foto 11', 'URL foto 12', 'URL foto 13', 'URL foto 14', 'URL foto 15', 
        'Válido para certificado', 'Valor existencia', 'Vehículo importado', 
        'Versión', 'Extras', 'BuNo', 'Código INT', 'Código fabricante', 
        'Equipamiento de serie', 'Estado', 'Carrocería', 'Días stock', 
        'Matrícula', 'Modelo'
    ]) as columna
),
columnas_existentes AS (
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_name = 'duc_scraper' 
    AND table_schema = 'public'
    AND column_name NOT IN ('id', 'file_name', 'import_date', 'last_seen_date', 'created_at', 'updated_at')
)
SELECT 
    'FALTAN' as estado,
    ce.columna as columna_faltante,
    'TEXT' as tipo_sugerido
FROM columnas_esperadas ce
LEFT JOIN columnas_existentes cx ON ce.columna = cx.column_name
WHERE cx.column_name IS NULL
ORDER BY ce.columna;

-- 4. Mostrar columnas que están en la tabla pero no en el Excel (si las hay)
WITH columnas_esperadas AS (
    SELECT unnest(ARRAY[
        'ID Anuncio', 'Anuncio', 'BPS / NEXT', 'Cambio', 'Certificado', 'Chasis', 
        'Color Carrocería', 'Color tapizado', 'Combustible', 'Concesionario', 
        'Creado con', 'Destino', 'Disponibilidad', 'Distintivo ambiental', 
        'Días creado', 'Días desde compra DMS', 'Días desde matriculación', 
        'Días publicado', 'e-code', 'El precio es', 'En uso', 'Fecha compra DMS', 
        'Fecha creación', 'Fecha disponibilidad', 'Fecha entrada VO', 
        'Fecha fabricación', 'Fecha modificación', 'Fecha primera matriculación', 
        'Fecha primera publicación', 'Garantía', 'KM', 'Libre de siniestros', 
        'Marca', 'Moneda', 'No completados', 'Nota interna', 'Observaciones', 
        'Origen', 'Origenes unificados', 'País origen', 'Potencia Cv', 'Precio', 
        'Precio compra', 'Precio cuota alquiler', 'Precio cuota renting', 
        'Precio estimado medio', 'Precio exportación', 'Precio financiado', 
        'Precio vehículo nuevo', 'Precio profesional', 'Proveedor', 'Referencia', 
        'Referencia interna', 'Regimen fiscal', 'Tienda', 'Tipo de distribución', 
        'Tipo motor', 'Trancha 1', 'Trancha 2', 'Trancha 3', 'Trancha 4', 
        'Trancha Combustible', 'Trancha YUC', 'Ubicación tienda', 'URL', 
        'URL foto 1', 'URL foto 2', 'URL foto 3', 'URL foto 4', 'URL foto 5', 
        'URL foto 6', 'URL foto 7', 'URL foto 8', 'URL foto 9', 'URL foto 10', 
        'URL foto 11', 'URL foto 12', 'URL foto 13', 'URL foto 14', 'URL foto 15', 
        'Válido para certificado', 'Valor existencia', 'Vehículo importado', 
        'Versión', 'Extras', 'BuNo', 'Código INT', 'Código fabricante', 
        'Equipamiento de serie', 'Estado', 'Carrocería', 'Días stock', 
        'Matrícula', 'Modelo'
    ]) as columna
),
columnas_existentes AS (
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_name = 'duc_scraper' 
    AND table_schema = 'public'
    AND column_name NOT IN ('id', 'file_name', 'import_date', 'last_seen_date', 'created_at', 'updated_at')
)
SELECT 
    'EXTRA' as estado,
    cx.column_name as columna_extra,
    'Está en la tabla pero no en el Excel' as observacion
FROM columnas_existentes cx
LEFT JOIN columnas_esperadas ce ON cx.column_name = ce.columna
WHERE ce.columna IS NULL
ORDER BY cx.column_name;

-- 5. Resumen final
SELECT 
    'RESUMEN' as tipo,
    'Columnas actuales: ' || (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'duc_scraper' AND table_schema = 'public') as info
UNION ALL
SELECT 
    'RESUMEN' as tipo,
    'Columnas esperadas: 95' as info
UNION ALL
SELECT 
    'RESUMEN' as tipo,
    'Columnas faltantes: ' || (
        SELECT COUNT(*) 
        FROM (
            SELECT unnest(ARRAY[
                'ID Anuncio', 'Anuncio', 'BPS / NEXT', 'Cambio', 'Certificado', 'Chasis', 
                'Color Carrocería', 'Color tapizado', 'Combustible', 'Concesionario', 
                'Creado con', 'Destino', 'Disponibilidad', 'Distintivo ambiental', 
                'Días creado', 'Días desde compra DMS', 'Días desde matriculación', 
                'Días publicado', 'e-code', 'El precio es', 'En uso', 'Fecha compra DMS', 
                'Fecha creación', 'Fecha disponibilidad', 'Fecha entrada VO', 
                'Fecha fabricación', 'Fecha modificación', 'Fecha primera matriculación', 
                'Fecha primera publicación', 'Garantía', 'KM', 'Libre de siniestros', 
                'Marca', 'Moneda', 'No completados', 'Nota interna', 'Observaciones', 
                'Origen', 'Origenes unificados', 'País origen', 'Potencia Cv', 'Precio', 
                'Precio compra', 'Precio cuota alquiler', 'Precio cuota renting', 
                'Precio estimado medio', 'Precio exportación', 'Precio financiado', 
                'Precio vehículo nuevo', 'Precio profesional', 'Proveedor', 'Referencia', 
                'Referencia interna', 'Regimen fiscal', 'Tienda', 'Tipo de distribución', 
                'Tipo motor', 'Trancha 1', 'Trancha 2', 'Trancha 3', 'Trancha 4', 
                'Trancha Combustible', 'Trancha YUC', 'Ubicación tienda', 'URL', 
                'URL foto 1', 'URL foto 2', 'URL foto 3', 'URL foto 4', 'URL foto 5', 
                'URL foto 6', 'URL foto 7', 'URL foto 8', 'URL foto 9', 'URL foto 10', 
                'URL foto 11', 'URL foto 12', 'URL foto 13', 'URL foto 14', 'URL foto 15', 
                'Válido para certificado', 'Valor existencia', 'Vehículo importado', 
                'Versión', 'Extras', 'BuNo', 'Código INT', 'Código fabricante', 
                'Equipamiento de serie', 'Estado', 'Carrocería', 'Días stock', 
                'Matrícula', 'Modelo'
            ]) as columna
        ) ce
        LEFT JOIN (
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = 'duc_scraper' 
            AND table_schema = 'public'
            AND column_name NOT IN ('id', 'file_name', 'import_date', 'last_seen_date', 'created_at', 'updated_at')
        ) cx ON ce.columna = cx.column_name
        WHERE cx.column_name IS NULL
    ) as info; 