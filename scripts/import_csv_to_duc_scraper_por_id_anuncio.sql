-- =====================================================
-- SISTEMA DE IMPORTACIÓN CSV A DUC_SCRAPER - POR ID ANUNCIO
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Sistema para importar datos CSV usando ID Anuncio como identificador
-- =====================================================

-- Función para importar CSV a duc_scraper usando ID Anuncio
CREATE OR REPLACE FUNCTION import_csv_to_duc_scraper_by_id_anuncio(
    csv_data JSONB,
    file_name_param TEXT DEFAULT 'unknown.csv'
)
RETURNS TABLE(
    total_rows INTEGER,
    imported_rows INTEGER,
    updated_rows INTEGER,
    error_rows INTEGER,
    errors TEXT[]
) AS $$
DECLARE
    row_data JSONB;
    row_count INTEGER := 0;
    imported_count INTEGER := 0;
    updated_count INTEGER := 0;
    error_count INTEGER := 0;
    error_messages TEXT[] := ARRAY[]::TEXT[];
    id_anuncio_value TEXT;
    existing_id UUID;
BEGIN
    -- Procesar cada fila del CSV
    FOR row_data IN SELECT * FROM jsonb_array_elements(csv_data)
    LOOP
        row_count := row_count + 1;
        
        BEGIN
            -- Extraer ID Anuncio como identificador único
            id_anuncio_value := row_data->>'ID Anuncio';
            
            -- Verificar si ya existe (mismo ID Anuncio)
            SELECT id INTO existing_id 
            FROM duc_scraper 
            WHERE "ID Anuncio" = id_anuncio_value;
            
            IF existing_id IS NOT NULL THEN
                -- Actualizar registro existente
                UPDATE duc_scraper SET
                    "Anuncio" = row_data->>'Anuncio',
                    "BPS / NEXT" = row_data->>'BPS / NEXT',
                    "Cambio" = row_data->>'Cambio',
                    "Certificado" = row_data->>'Certificado',
                    "Chasis" = row_data->>'Chasis',
                    "Color Carrocería" = row_data->>'Color Carrocería',
                    "Color tapizado" = row_data->>'Color tapizado',
                    "Combustible" = row_data->>'Combustible',
                    "Concesionario" = row_data->>'Concesionario',
                    "Creado con" = row_data->>'Creado con',
                    "Destino" = row_data->>'Destino',
                    "Disponibilidad" = row_data->>'Disponibilidad',
                    "Distintivo ambiental" = row_data->>'Distintivo ambiental',
                    "Días creado" = row_data->>'Días creado',
                    "Días desde compra DMS" = row_data->>'Días desde compra DMS',
                    "Días desde matriculación" = row_data->>'Días desde matriculación',
                    "Días publicado" = row_data->>'Días publicado',
                    "e-code" = row_data->>'e-code',
                    "El precio es" = row_data->>'El precio es',
                    "En uso" = row_data->>'En uso',
                    "Fecha compra DMS" = row_data->>'Fecha compra DMS',
                    "Fecha creación" = row_data->>'Fecha creación',
                    "Fecha disponibilidad" = row_data->>'Fecha disponibilidad',
                    "Fecha entrada VO" = row_data->>'Fecha entrada VO',
                    "Fecha fabricación" = row_data->>'Fecha fabricación',
                    "Fecha modificación" = row_data->>'Fecha modificación',
                    "Fecha primera matriculación" = row_data->>'Fecha primera matriculación',
                    "Fecha primera publicación" = row_data->>'Fecha primera publicación',
                    "Garantía" = row_data->>'Garantía',
                    "KM" = row_data->>'KM',
                    "Libre de siniestros" = row_data->>'Libre de siniestros',
                    "Marca" = row_data->>'Marca',
                    "Moneda" = row_data->>'Moneda',
                    "No completados" = row_data->>'No completados',
                    "Nota interna" = row_data->>'Nota interna',
                    "Observaciones" = row_data->>'Observaciones',
                    "Origen" = row_data->>'Origen',
                    "Origenes unificados" = row_data->>'Origenes unificados',
                    "País origen" = row_data->>'País origen',
                    "Potencia Cv" = row_data->>'Potencia Cv',
                    "Precio" = row_data->>'Precio',
                    "Precio compra" = row_data->>'Precio compra',
                    "Precio cuota alquiler" = row_data->>'Precio cuota alquiler',
                    "Precio cuota renting" = row_data->>'Precio cuota renting',
                    "Precio estimado medio" = row_data->>'Precio estimado medio',
                    "Precio exportación" = row_data->>'Precio exportación',
                    "Precio financiado" = row_data->>'Precio financiado',
                    "Precio vehículo nuevo" = row_data->>'Precio vehículo nuevo',
                    "Precio profesional" = row_data->>'Precio profesional',
                    "Proveedor" = row_data->>'Proveedor',
                    "Referencia" = row_data->>'Referencia',
                    "Referencia interna" = row_data->>'Referencia interna',
                    "Regimen fiscal" = row_data->>'Regimen fiscal',
                    "Tienda" = row_data->>'Tienda',
                    "Tipo de distribución" = row_data->>'Tipo de distribución',
                    "Tipo motor" = row_data->>'Tipo motor',
                    "Trancha 1" = row_data->>'Trancha 1',
                    "Trancha 2" = row_data->>'Trancha 2',
                    "Trancha 3" = row_data->>'Trancha 3',
                    "Trancha 4" = row_data->>'Trancha 4',
                    "Trancha Combustible" = row_data->>'Trancha Combustible',
                    "Trancha YUC" = row_data->>'Trancha YUC',
                    "Ubicación tienda" = row_data->>'Ubicación tienda',
                    "URL" = row_data->>'URL',
                    "URL foto 1" = row_data->>'URL foto 1',
                    "URL foto 2" = row_data->>'URL foto 2',
                    "URL foto 3" = row_data->>'URL foto 3',
                    "URL foto 4" = row_data->>'URL foto 4',
                    "URL foto 5" = row_data->>'URL foto 5',
                    "URL foto 6" = row_data->>'URL foto 6',
                    "URL foto 7" = row_data->>'URL foto 7',
                    "URL foto 8" = row_data->>'URL foto 8',
                    "URL foto 9" = row_data->>'URL foto 9',
                    "URL foto 10" = row_data->>'URL foto 10',
                    "URL foto 11" = row_data->>'URL foto 11',
                    "URL foto 12" = row_data->>'URL foto 12',
                    "URL foto 13" = row_data->>'URL foto 13',
                    "URL foto 14" = row_data->>'URL foto 14',
                    "URL foto 15" = row_data->>'URL foto 15',
                    "Válido para certificado" = row_data->>'Válido para certificado',
                    "Valor existencia" = row_data->>'Valor existencia',
                    "Vehículo importado" = row_data->>'Vehículo importado',
                    "Versión" = row_data->>'Versión',
                    "Extras" = row_data->>'Extras',
                    "BuNo" = row_data->>'BuNo',
                    "Código INT" = row_data->>'Código INT',
                    "Código fabricante" = row_data->>'Código fabricante',
                    "Equipamiento de serie" = row_data->>'Equipamiento de serie',
                    "Estado" = row_data->>'Estado',
                    "Carrocería" = row_data->>'Carrocería',
                    file_name = file_name_param,
                    last_seen_date = NOW(),
                    updated_at = NOW()
                WHERE id = existing_id;
                
                updated_count := updated_count + 1;
            ELSE
                -- Insertar nuevo registro (aunque sea duplicado)
                INSERT INTO duc_scraper (
                    "ID Anuncio", "Anuncio", "BPS / NEXT", "Cambio", "Certificado",
                    "Chasis", "Color Carrocería", "Color tapizado", "Combustible",
                    "Concesionario", "Creado con", "Destino", "Disponibilidad",
                    "Distintivo ambiental", "Días creado", "Días desde compra DMS",
                    "Días desde matriculación", "Días publicado", "e-code",
                    "El precio es", "En uso", "Fecha compra DMS", "Fecha creación",
                    "Fecha disponibilidad", "Fecha entrada VO", "Fecha fabricación",
                    "Fecha modificación", "Fecha primera matriculación",
                    "Fecha primera publicación", "Garantía", "KM", "Libre de siniestros",
                    "Marca", "Moneda", "No completados", "Nota interna", "Observaciones",
                    "Origen", "Origenes unificados", "País origen", "Potencia Cv",
                    "Precio", "Precio compra", "Precio cuota alquiler", "Precio cuota renting",
                    "Precio estimado medio", "Precio exportación", "Precio financiado",
                    "Precio vehículo nuevo", "Precio profesional", "Proveedor",
                    "Referencia", "Referencia interna", "Regimen fiscal", "Tienda",
                    "Tipo de distribución", "Tipo motor", "Trancha 1", "Trancha 2",
                    "Trancha 3", "Trancha 4", "Trancha Combustible", "Trancha YUC",
                    "Ubicación tienda", "URL", "URL foto 1", "URL foto 2", "URL foto 3",
                    "URL foto 4", "URL foto 5", "URL foto 6", "URL foto 7", "URL foto 8",
                    "URL foto 9", "URL foto 10", "URL foto 11", "URL foto 12",
                    "URL foto 13", "URL foto 14", "URL foto 15", "Válido para certificado",
                    "Valor existencia", "Vehículo importado", "Versión", "Extras",
                    "BuNo", "Código INT", "Código fabricante", "Equipamiento de serie",
                    "Estado", "Carrocería", file_name, import_date, last_seen_date
                ) VALUES (
                    row_data->>'ID Anuncio', row_data->>'Anuncio', row_data->>'BPS / NEXT',
                    row_data->>'Cambio', row_data->>'Certificado', row_data->>'Chasis',
                    row_data->>'Color Carrocería', row_data->>'Color tapizado',
                    row_data->>'Combustible', row_data->>'Concesionario',
                    row_data->>'Creado con', row_data->>'Destino', row_data->>'Disponibilidad',
                    row_data->>'Distintivo ambiental', row_data->>'Días creado',
                    row_data->>'Días desde compra DMS', row_data->>'Días desde matriculación',
                    row_data->>'Días publicado', row_data->>'e-code', row_data->>'El precio es',
                    row_data->>'En uso', row_data->>'Fecha compra DMS', row_data->>'Fecha creación',
                    row_data->>'Fecha disponibilidad', row_data->>'Fecha entrada VO',
                    row_data->>'Fecha fabricación', row_data->>'Fecha modificación',
                    row_data->>'Fecha primera matriculación', row_data->>'Fecha primera publicación',
                    row_data->>'Garantía', row_data->>'KM', row_data->>'Libre de siniestros',
                    row_data->>'Marca', row_data->>'Moneda', row_data->>'No completados',
                    row_data->>'Nota interna', row_data->>'Observaciones', row_data->>'Origen',
                    row_data->>'Origenes unificados', row_data->>'País origen',
                    row_data->>'Potencia Cv', row_data->>'Precio', row_data->>'Precio compra',
                    row_data->>'Precio cuota alquiler', row_data->>'Precio cuota renting',
                    row_data->>'Precio estimado medio', row_data->>'Precio exportación',
                    row_data->>'Precio financiado', row_data->>'Precio vehículo nuevo',
                    row_data->>'Precio profesional', row_data->>'Proveedor',
                    row_data->>'Referencia', row_data->>'Referencia interna',
                    row_data->>'Regimen fiscal', row_data->>'Tienda',
                    row_data->>'Tipo de distribución', row_data->>'Tipo motor',
                    row_data->>'Trancha 1', row_data->>'Trancha 2', row_data->>'Trancha 3',
                    row_data->>'Trancha 4', row_data->>'Trancha Combustible',
                    row_data->>'Trancha YUC', row_data->>'Ubicación tienda',
                    row_data->>'URL', row_data->>'URL foto 1', row_data->>'URL foto 2',
                    row_data->>'URL foto 3', row_data->>'URL foto 4', row_data->>'URL foto 5',
                    row_data->>'URL foto 6', row_data->>'URL foto 7', row_data->>'URL foto 8',
                    row_data->>'URL foto 9', row_data->>'URL foto 10', row_data->>'URL foto 11',
                    row_data->>'URL foto 12', row_data->>'URL foto 13', row_data->>'URL foto 14',
                    row_data->>'URL foto 15', row_data->>'Válido para certificado',
                    row_data->>'Valor existencia', row_data->>'Vehículo importado',
                    row_data->>'Versión', row_data->>'Extras', row_data->>'BuNo',
                    row_data->>'Código INT', row_data->>'Código fabricante',
                    row_data->>'Equipamiento de serie', row_data->>'Estado',
                    row_data->>'Carrocería', file_name_param, NOW(), NOW()
                );
                
                imported_count := imported_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_messages := array_append(error_messages, 
                'Fila ' || row_count || ': ' || SQLERRM);
        END;
    END LOOP;
    
    RETURN QUERY SELECT 
        row_count,
        imported_count,
        updated_count,
        error_count,
        error_messages;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de importación
CREATE OR REPLACE FUNCTION get_duc_scraper_stats()
RETURNS TABLE(
    total_records INTEGER,
    unique_id_anuncios INTEGER,
    unique_chasis INTEGER,
    unique_concesionarios INTEGER,
    latest_import_date TIMESTAMP WITH TIME ZONE,
    records_with_photos INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_records,
        COUNT(DISTINCT "ID Anuncio")::INTEGER as unique_id_anuncios,
        COUNT(DISTINCT "Chasis")::INTEGER as unique_chasis,
        COUNT(DISTINCT "Concesionario")::INTEGER as unique_concesionarios,
        MAX(import_date) as latest_import_date,
        COUNT(*) FILTER (WHERE "URL foto 1" IS NOT NULL AND "URL foto 1" != '')::INTEGER as records_with_photos
    FROM duc_scraper;
END;
$$ LANGUAGE plpgsql;

-- Mostrar mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'SISTEMA DE IMPORTACIÓN CSV POR ID ANUNCIO CREADO';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Función creada: import_csv_to_duc_scraper_by_id_anuncio()';
    RAISE NOTICE 'Función creada: get_duc_scraper_stats()';
    RAISE NOTICE '';
    RAISE NOTICE 'LÓGICA:';
    RAISE NOTICE '- Mismo ID Anuncio → ACTUALIZA';
    RAISE NOTICE '- ID Anuncio diferente → INSERTA (aunque sea duplicado)';
    RAISE NOTICE '';
    RAISE NOTICE 'USO:';
    RAISE NOTICE 'SELECT * FROM import_csv_to_duc_scraper_by_id_anuncio(csv_data, filename);';
    RAISE NOTICE 'SELECT * FROM get_duc_scraper_stats();';
    RAISE NOTICE '=====================================================';
END $$; 