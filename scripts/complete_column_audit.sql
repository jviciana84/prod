-- =====================================================
-- AUDITORÍA COMPLETA DE COLUMNAS DUC_SCRAPER
-- =====================================================

-- 1. Mostrar TODAS las columnas actuales ordenadas
SELECT 
    'COLUMNAS ACTUALES' as tipo,
    column_name,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'duc_scraper' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Definir las 95 columnas exactas del Excel
WITH columnas_excel AS (
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
columnas_actuales AS (
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_name = 'duc_scraper' 
    AND table_schema = 'public'
    AND column_name NOT IN ('id', 'file_name', 'import_date', 'last_seen_date', 'created_at', 'updated_at')
)
SELECT 
    'FALTAN DEL EXCEL' as tipo,
    ce.columna as columna_faltante
FROM columnas_excel ce
LEFT JOIN columnas_actuales ca ON ce.columna = ca.column_name
WHERE ca.column_name IS NULL
ORDER BY ce.columna;

-- 3. Mostrar columnas que están en la tabla pero no en el Excel
WITH columnas_excel AS (
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
columnas_actuales AS (
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_name = 'duc_scraper' 
    AND table_schema = 'public'
    AND column_name NOT IN ('id', 'file_name', 'import_date', 'last_seen_date', 'created_at', 'updated_at')
)
SELECT 
    'EXTRA EN TABLA' as tipo,
    ca.column_name as columna_extra
FROM columnas_actuales ca
LEFT JOIN columnas_excel ce ON ca.column_name = ce.columna
WHERE ce.columna IS NULL
ORDER BY ca.column_name;

-- 4. Resumen final
SELECT 
    'RESUMEN' as tipo,
    'Columnas del Excel: 95' as info
UNION ALL
SELECT 
    'RESUMEN' as tipo,
    'Columnas en tabla (sin metadatos): ' || (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'duc_scraper' 
        AND table_schema = 'public'
        AND column_name NOT IN ('id', 'file_name', 'import_date', 'last_seen_date', 'created_at', 'updated_at')
    ) as info
UNION ALL
SELECT 
    'RESUMEN' as tipo,
    'Metadatos: 6' as info
UNION ALL
SELECT 
    'RESUMEN' as tipo,
    'Total columnas: ' || (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'duc_scraper' 
        AND table_schema = 'public'
    ) as info; 