-- =====================================================
-- IDENTIFICAR LA ÚLTIMA COLUMNA FALTANTE
-- =====================================================
-- Descripción: Identificar exactamente qué columna falta para completar las 95 del Excel
-- =====================================================

-- Definir las 95 columnas exactas del Excel
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
    'COLUMNA FALTANTE' as tipo,
    ce.columna as columna_faltante,
    'TEXT' as tipo_sugerido
FROM columnas_esperadas ce
LEFT JOIN columnas_existentes cx ON ce.columna = cx.column_name
WHERE cx.column_name IS NULL
ORDER BY ce.columna;

-- Mostrar conteo detallado
SELECT 
    'DETALLE' as tipo,
    'Columnas del Excel esperadas: 95' as info
UNION ALL
SELECT 
    'DETALLE' as tipo,
    'Columnas existentes (sin metadatos): ' || (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'duc_scraper' 
        AND table_schema = 'public'
        AND column_name NOT IN ('id', 'file_name', 'import_date', 'last_seen_date', 'created_at', 'updated_at')
    ) as info
UNION ALL
SELECT 
    'DETALLE' as tipo,
    'Metadatos (id, file_name, etc.): 6' as info
UNION ALL
SELECT 
    'DETALLE' as tipo,
    'Total actual: ' || (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'duc_scraper' 
        AND table_schema = 'public'
    ) as info; 