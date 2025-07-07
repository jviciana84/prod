-- Script para corregir formatos de fecha existentes en las tablas
-- Convierte fechas de formato DD/MM/YYYY a YYYY-MM-DD

-- Función auxiliar para convertir fechas DD/MM/YYYY a YYYY-MM-DD
CREATE OR REPLACE FUNCTION convert_date_format(date_text TEXT)
RETURNS DATE AS $$
BEGIN
    -- Si es NULL o vacío, retornar NULL
    IF date_text IS NULL OR TRIM(date_text) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Si ya es una fecha válida en formato ISO, retornarla
    BEGIN
        RETURN date_text::DATE;
    EXCEPTION WHEN OTHERS THEN
        -- Continuar con la conversión
    END;
    
    -- Intentar convertir formato DD/MM/YYYY o DD-MM-YYYY
    BEGIN
        -- Extraer día, mes y año usando regex
        IF date_text ~ '^\d{1,2}[/-]\d{1,2}[/-]\d{4}$' THEN
            DECLARE
                parts TEXT[];
                day_part TEXT;
                month_part TEXT;
                year_part TEXT;
                converted_date DATE;
            BEGIN
                -- Dividir por / o -
                parts := string_to_array(date_text, CASE WHEN position('/' in date_text) > 0 THEN '/' ELSE '-' END);
                
                day_part := LPAD(parts[1], 2, '0');
                month_part := LPAD(parts[2], 2, '0');
                year_part := parts[3];
                
                -- Validar rangos
                IF parts[1]::INTEGER BETWEEN 1 AND 31 AND 
                   parts[2]::INTEGER BETWEEN 1 AND 12 AND 
                   parts[3]::INTEGER BETWEEN 1900 AND 2100 THEN
                    
                    -- Construir fecha en formato YYYY-MM-DD
                    converted_date := (year_part || '-' || month_part || '-' || day_part)::DATE;
                    RETURN converted_date;
                END IF;
            END;
        END IF;
        
        -- Si no se pudo convertir, retornar NULL
        RETURN NULL;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRACIÓN DE TABLA pdf_extracted_data
-- =====================================================

DO $$
DECLARE
    rec RECORD;
    converted_fecha_pedido DATE;
    converted_primera_fecha DATE;
    total_records INTEGER := 0;
    updated_fecha_pedido INTEGER := 0;
    updated_primera_fecha INTEGER := 0;
    errors_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 === INICIANDO MIGRACIÓN DE pdf_extracted_data ===';
    
    -- Contar registros totales
    SELECT COUNT(*) INTO total_records FROM pdf_extracted_data;
    RAISE NOTICE '📊 Total de registros en pdf_extracted_data: %', total_records;
    
    -- Procesar cada registro
    FOR rec IN 
        SELECT id, fecha_pedido, primera_fecha_matriculacion 
        FROM pdf_extracted_data 
        WHERE fecha_pedido IS NOT NULL OR primera_fecha_matriculacion IS NOT NULL
    LOOP
        BEGIN
            -- Convertir fecha_pedido si es necesario
            IF rec.fecha_pedido IS NOT NULL THEN
                converted_fecha_pedido := convert_date_format(rec.fecha_pedido::TEXT);
                
                IF converted_fecha_pedido IS NOT NULL AND converted_fecha_pedido::TEXT != rec.fecha_pedido::TEXT THEN
                    UPDATE pdf_extracted_data 
                    SET fecha_pedido = converted_fecha_pedido 
                    WHERE id = rec.id;
                    
                    updated_fecha_pedido := updated_fecha_pedido + 1;
                    RAISE NOTICE '✅ ID % - fecha_pedido: % → %', rec.id, rec.fecha_pedido, converted_fecha_pedido;
                END IF;
            END IF;
            
            -- Convertir primera_fecha_matriculacion si es necesario
            IF rec.primera_fecha_matriculacion IS NOT NULL THEN
                converted_primera_fecha := convert_date_format(rec.primera_fecha_matriculacion::TEXT);
                
                IF converted_primera_fecha IS NOT NULL AND converted_primera_fecha::TEXT != rec.primera_fecha_matriculacion::TEXT THEN
                    UPDATE pdf_extracted_data 
                    SET primera_fecha_matriculacion = converted_primera_fecha 
                    WHERE id = rec.id;
                    
                    updated_primera_fecha := updated_primera_fecha + 1;
                    RAISE NOTICE '✅ ID % - primera_fecha_matriculacion: % → %', rec.id, rec.primera_fecha_matriculacion, converted_primera_fecha;
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            errors_count := errors_count + 1;
            RAISE NOTICE '❌ Error procesando ID %: %', rec.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '📊 === RESUMEN pdf_extracted_data ===';
    RAISE NOTICE '✅ fecha_pedido actualizadas: %', updated_fecha_pedido;
    RAISE NOTICE '✅ primera_fecha_matriculacion actualizadas: %', updated_primera_fecha;
    RAISE NOTICE '❌ Errores: %', errors_count;
END $$;

-- =====================================================
-- MIGRACIÓN DE TABLA sales_vehicles
-- =====================================================

DO $$
DECLARE
    rec RECORD;
    converted_sale_date DATE;
    converted_order_date DATE;
    converted_registration_date DATE;
    total_records INTEGER := 0;
    updated_sale_date INTEGER := 0;
    updated_order_date INTEGER := 0;
    updated_registration_date INTEGER := 0;
    errors_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 === INICIANDO MIGRACIÓN DE sales_vehicles ===';
    
    -- Contar registros totales
    SELECT COUNT(*) INTO total_records FROM sales_vehicles;
    RAISE NOTICE '📊 Total de registros en sales_vehicles: %', total_records;
    
    -- Procesar cada registro
    FOR rec IN 
        SELECT id, sale_date, order_date, registration_date 
        FROM sales_vehicles 
        WHERE sale_date IS NOT NULL OR order_date IS NOT NULL OR registration_date IS NOT NULL
    LOOP
        BEGIN
            -- Convertir sale_date si es necesario
            IF rec.sale_date IS NOT NULL THEN
                converted_sale_date := convert_date_format(rec.sale_date::TEXT);
                
                IF converted_sale_date IS NOT NULL AND converted_sale_date::TEXT != rec.sale_date::TEXT THEN
                    UPDATE sales_vehicles 
                    SET sale_date = converted_sale_date 
                    WHERE id = rec.id;
                    
                    updated_sale_date := updated_sale_date + 1;
                    RAISE NOTICE '✅ ID % - sale_date: % → %', rec.id, rec.sale_date, converted_sale_date;
                END IF;
            END IF;
            
            -- Convertir order_date si es necesario
            IF rec.order_date IS NOT NULL THEN
                converted_order_date := convert_date_format(rec.order_date::TEXT);
                
                IF converted_order_date IS NOT NULL AND converted_order_date::TEXT != rec.order_date::TEXT THEN
                    UPDATE sales_vehicles 
                    SET order_date = converted_order_date 
                    WHERE id = rec.id;
                    
                    updated_order_date := updated_order_date + 1;
                    RAISE NOTICE '✅ ID % - order_date: % → %', rec.id, rec.order_date, converted_order_date;
                END IF;
            END IF;
            
            -- Convertir registration_date si es necesario
            IF rec.registration_date IS NOT NULL THEN
                converted_registration_date := convert_date_format(rec.registration_date::TEXT);
                
                IF converted_registration_date IS NOT NULL AND converted_registration_date::TEXT != rec.registration_date::TEXT THEN
                    UPDATE sales_vehicles 
                    SET registration_date = converted_registration_date 
                    WHERE id = rec.id;
                    
                    updated_registration_date := updated_registration_date + 1;
                    RAISE NOTICE '✅ ID % - registration_date: % → %', rec.id, rec.registration_date, converted_registration_date;
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            errors_count := errors_count + 1;
            RAISE NOTICE '❌ Error procesando ID %: %', rec.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '📊 === RESUMEN sales_vehicles ===';
    RAISE NOTICE '✅ sale_date actualizadas: %', updated_sale_date;
    RAISE NOTICE '✅ order_date actualizadas: %', updated_order_date;
    RAISE NOTICE '✅ registration_date actualizadas: %', updated_registration_date;
    RAISE NOTICE '❌ Errores: %', errors_count;
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    invalid_dates_pdf INTEGER := 0;
    invalid_dates_sales INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 === VERIFICACIÓN FINAL ===';
    
    -- Verificar fechas inválidas en pdf_extracted_data
    SELECT COUNT(*) INTO invalid_dates_pdf
    FROM pdf_extracted_data 
    WHERE (fecha_pedido IS NOT NULL AND fecha_pedido::TEXT ~ '^\d{1,2}[/-]\d{1,2}[/-]\d{4}$')
       OR (primera_fecha_matriculacion IS NOT NULL AND primera_fecha_matriculacion::TEXT ~ '^\d{1,2}[/-]\d{1,2}[/-]\d{4}$');
    
    -- Verificar fechas inválidas en sales_vehicles
    SELECT COUNT(*) INTO invalid_dates_sales
    FROM sales_vehicles 
    WHERE (sale_date IS NOT NULL AND sale_date::TEXT ~ '^\d{1,2}[/-]\d{1,2}[/-]\d{4}$')
       OR (order_date IS NOT NULL AND order_date::TEXT ~ '^\d{1,2}[/-]\d{1,2}[/-]\d{4}$')
       OR (registration_date IS NOT NULL AND registration_date::TEXT ~ '^\d{1,2}[/-]\d{1,2}[/-]\d{4}$');
    
    RAISE NOTICE '📊 Fechas pendientes en pdf_extracted_data: %', invalid_dates_pdf;
    RAISE NOTICE '📊 Fechas pendientes en sales_vehicles: %', invalid_dates_sales;
    
    IF invalid_dates_pdf = 0 AND invalid_dates_sales = 0 THEN
        RAISE NOTICE '🎉 ¡MIGRACIÓN COMPLETADA! Todas las fechas están en formato correcto.';
    ELSE
        RAISE NOTICE '⚠️  Aún hay fechas pendientes de conversión. Revisar manualmente.';
    END IF;
END $$;

-- Limpiar función auxiliar
DROP FUNCTION IF EXISTS convert_date_format(TEXT);

-- Mostrar algunas fechas de ejemplo después de la migración
RAISE NOTICE '📋 === EJEMPLOS DE FECHAS DESPUÉS DE LA MIGRACIÓN ===';

SELECT 
    'pdf_extracted_data' as tabla,
    id,
    fecha_pedido,
    primera_fecha_matriculacion
FROM pdf_extracted_data 
WHERE fecha_pedido IS NOT NULL OR primera_fecha_matriculacion IS NOT NULL
LIMIT 5;

SELECT 
    'sales_vehicles' as tabla,
    id,
    sale_date,
    order_date,
    registration_date
FROM sales_vehicles 
WHERE sale_date IS NOT NULL OR order_date IS NOT NULL OR registration_date IS NOT NULL
LIMIT 5;
