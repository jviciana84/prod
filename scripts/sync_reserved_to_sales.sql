-- =====================================================
-- SINCRONIZAR VEHÍCULOS RESERVADOS DEL CSV CON VENTAS
-- =====================================================
-- Descripción: Cuando un vehículo aparece como "Reservado" en el CSV,
-- se considera vendido y debe aparecer en la pestaña "Vendido" de Stock
-- =====================================================

-- 1. Crear función para sincronizar vehículos reservados
CREATE OR REPLACE FUNCTION sync_reserved_vehicles_from_csv()
RETURNS void AS $$
DECLARE
    reserved_vehicle RECORD;
    stock_vehicle RECORD;
    sales_record_id UUID;
BEGIN
    -- Log de inicio
    RAISE NOTICE '🔄 Iniciando sincronización de vehículos reservados...';
    
    -- Procesar vehículos que aparecen como "Reservado" en el CSV
    FOR reserved_vehicle IN 
        SELECT DISTINCT 
            "Matrícula",
            "Modelo",
            "Marca",
            "Precio",
            "Concesionario",
            "Fecha disponibilidad",
            last_seen_date,
            import_date
        FROM duc_scraper 
        WHERE "Disponibilidad" ILIKE '%reservado%'
        AND "Matrícula" IS NOT NULL
        AND "Matrícula" != ''
    LOOP
        -- Buscar el vehículo en stock
        SELECT * INTO stock_vehicle 
        FROM stock 
        WHERE license_plate = reserved_vehicle."Matrícula"
        LIMIT 1;
        
        -- Si el vehículo existe en stock y no está ya vendido
        IF stock_vehicle.id IS NOT NULL THEN
            -- Verificar si ya existe en sales_vehicles
            IF NOT EXISTS (
                SELECT 1 FROM sales_vehicles 
                WHERE license_plate = reserved_vehicle."Matrícula"
            ) THEN
                -- Crear registro en sales_vehicles
                INSERT INTO sales_vehicles (
                    license_plate,
                    model,
                    vehicle_type,
                    stock_id,
                    sale_date,
                    advisor_name,
                    price,
                    payment_method,
                    payment_status,
                    validated,
                    cyp_status,
                    photo_360_status,
                    created_at,
                    updated_at
                ) VALUES (
                    reserved_vehicle."Matrícula",
                    COALESCE(reserved_vehicle."Modelo", 'Sin modelo'),
                    'Coche',
                    stock_vehicle.id,
                    COALESCE(reserved_vehicle."Fecha disponibilidad"::timestamp, reserved_vehicle.last_seen_date),
                    COALESCE(reserved_vehicle."Concesionario", 'Sin concesionario'),
                    CASE 
                        WHEN reserved_vehicle."Precio" ~ '^[0-9]+$' 
                        THEN CAST(reserved_vehicle."Precio" AS DECIMAL)
                        ELSE NULL
                    END,
                    'Contado',
                    'Completado',
                    true,
                    'pendiente',
                    'pendiente',
                    NOW(),
                    NOW()
                ) RETURNING id INTO sales_record_id;
                
                RAISE NOTICE '✅ Vehículo % marcado como vendido (reservado en CSV)', reserved_vehicle."Matrícula";
                
                -- También marcar en vehicle_sale_status
                INSERT INTO vehicle_sale_status (
                    vehicle_id,
                    source_table,
                    license_plate,
                    sale_status,
                    notes,
                    created_at
                ) VALUES (
                    stock_vehicle.id,
                    'stock',
                    reserved_vehicle."Matrícula",
                    'vendido',
                    'Marcado como vendido desde CSV (Reservado)',
                    NOW()
                ) ON CONFLICT (vehicle_id, source_table) 
                DO UPDATE SET 
                    sale_status = 'vendido',
                    notes = 'Actualizado desde CSV (Reservado)',
                    created_at = NOW();
                    
            ELSE
                RAISE NOTICE 'ℹ️ Vehículo % ya está en sales_vehicles', reserved_vehicle."Matrícula";
            END IF;
        ELSE
            RAISE NOTICE '⚠️ Vehículo % no encontrado en stock', reserved_vehicle."Matrícula";
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Sincronización de vehículos reservados completada';
END;
$$ LANGUAGE plpgsql;

-- 2. Crear trigger para sincronización automática
CREATE OR REPLACE FUNCTION trigger_sync_reserved_on_csv_import()
RETURNS TRIGGER AS $$
BEGIN
    -- Ejecutar sincronización cuando se importan nuevos datos del CSV
    PERFORM sync_reserved_vehicles_from_csv();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear trigger en duc_scraper
DROP TRIGGER IF EXISTS trigger_sync_reserved_vehicles ON duc_scraper;

CREATE TRIGGER trigger_sync_reserved_vehicles
    AFTER INSERT OR UPDATE ON duc_scraper
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_sync_reserved_on_csv_import();

-- 4. Función para ejecutar sincronización manual
CREATE OR REPLACE FUNCTION manual_sync_reserved_vehicles()
RETURNS TABLE(
    processed_count INTEGER,
    message TEXT
) AS $$
DECLARE
    count_result INTEGER;
BEGIN
    -- Ejecutar sincronización
    PERFORM sync_reserved_vehicles_from_csv();
    
    -- Contar vehículos procesados
    SELECT COUNT(*) INTO count_result
    FROM duc_scraper 
    WHERE "Disponibilidad" ILIKE '%reservado%'
    AND "Matrícula" IS NOT NULL;
    
    RETURN QUERY SELECT 
        count_result,
        'Sincronización manual completada. Vehículos reservados procesados: ' || count_result;
END;
$$ LANGUAGE plpgsql;

-- 5. Verificar configuración actual
SELECT '=== CONFIGURACIÓN ACTUAL ===' as info;

-- Verificar vehículos reservados en CSV
SELECT 
    'Vehículos reservados en CSV' as tipo,
    COUNT(*) as cantidad
FROM duc_scraper 
WHERE "Disponibilidad" ILIKE '%reservado%'
AND "Matrícula" IS NOT NULL

UNION ALL

-- Verificar vehículos vendidos en sales_vehicles
SELECT 
    'Vehículos en sales_vehicles' as tipo,
    COUNT(*) as cantidad
FROM sales_vehicles

UNION ALL

-- Verificar vehículos en vehicle_sale_status
SELECT 
    'Vehículos en vehicle_sale_status' as tipo,
    COUNT(*) as cantidad
FROM vehicle_sale_status;

-- 6. Mostrar vehículos reservados que necesitan sincronización
SELECT 
    'Vehículos reservados pendientes de sincronización' as info,
    "Matrícula",
    "Modelo",
    "Marca",
    "Precio",
    "Concesionario",
    "Disponibilidad",
    last_seen_date
FROM duc_scraper 
WHERE "Disponibilidad" ILIKE '%reservado%'
AND "Matrícula" IS NOT NULL
AND "Matrícula" NOT IN (
    SELECT license_plate FROM sales_vehicles
)
ORDER BY last_seen_date DESC;

-- Comentarios para documentar
COMMENT ON FUNCTION sync_reserved_vehicles_from_csv() IS 'Sincroniza vehículos reservados del CSV con el sistema de ventas';
COMMENT ON FUNCTION trigger_sync_reserved_on_csv_import() IS 'Trigger que ejecuta sincronización automática al importar CSV';
COMMENT ON FUNCTION manual_sync_reserved_vehicles() IS 'Función para ejecutar sincronización manual de vehículos reservados'; 