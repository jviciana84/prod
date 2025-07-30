-- =====================================================
-- VERIFICAR Y CREAR FUNCIONES DE SINCRONIZACIÓN
-- =====================================================
-- Descripción: Verifica si las funciones de sincronización existen
-- y las crea si no están disponibles
-- =====================================================

-- 1. Verificar si la función sync_photos_with_sales existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'sync_photos_with_sales'
    ) THEN
        RAISE NOTICE '❌ Función sync_photos_with_sales no existe. Creándola...';
        
        -- Crear la función sync_photos_with_sales
        CREATE OR REPLACE FUNCTION sync_photos_with_sales()
        RETURNS TABLE(
            processed_count INTEGER,
            removed_count INTEGER,
            message TEXT
        ) AS $$
        DECLARE
            sold_vehicle RECORD;
            photos_count INTEGER;
            total_processed INTEGER := 0;
            total_removed INTEGER := 0;
        BEGIN
            -- Log de inicio
            RAISE NOTICE '🔄 Iniciando sincronización de fotos con ventas...';
            
            -- Procesar todos los vehículos vendidos
            FOR sold_vehicle IN 
                SELECT DISTINCT license_plate 
                FROM sales_vehicles 
                WHERE license_plate IS NOT NULL
            LOOP
                -- Contar registros en fotos para este vehículo
                SELECT COUNT(*) INTO photos_count
                FROM fotos 
                WHERE license_plate = sold_vehicle.license_plate;
                
                -- Si hay registros en fotos, eliminarlos
                IF photos_count > 0 THEN
                    DELETE FROM fotos 
                    WHERE license_plate = sold_vehicle.license_plate;
                    
                    total_removed := total_removed + photos_count;
                    RAISE NOTICE '✅ Vehículo % eliminado de fotos (% registros)', 
                        sold_vehicle.license_plate, photos_count;
                END IF;
                
                total_processed := total_processed + 1;
            END LOOP;
            
            RETURN QUERY SELECT 
                total_processed,
                total_removed,
                'Sincronización completada. Vehículos procesados: ' || total_processed || 
                ', Registros eliminados de fotos: ' || total_removed;
                
            RAISE NOTICE '✅ Sincronización completada. Procesados: %, Eliminados: %', 
                total_processed, total_removed;
        END;
        $$ LANGUAGE plpgsql;
        
        RAISE NOTICE '✅ Función sync_photos_with_sales creada exitosamente';
    ELSE
        RAISE NOTICE '✅ Función sync_photos_with_sales ya existe';
    END IF;
END $$;

-- 2. Verificar si la función check_photos_sales_inconsistencies existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'check_photos_sales_inconsistencies'
    ) THEN
        RAISE NOTICE '❌ Función check_photos_sales_inconsistencies no existe. Creándola...';
        
        -- Crear la función check_photos_sales_inconsistencies
        CREATE OR REPLACE FUNCTION check_photos_sales_inconsistencies()
        RETURNS TABLE(
            license_plate TEXT,
            model TEXT,
            sale_date TIMESTAMP,
            advisor TEXT,
            photos_status TEXT,
            inconsistency_type TEXT
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                sv.license_plate,
                sv.model,
                sv.sale_date,
                COALESCE(sv.advisor_name, sv.advisor) as advisor,
                CASE 
                    WHEN f.license_plate IS NULL THEN 'NO TIENE FOTOS'
                    WHEN f.photos_completed = false THEN 'FOTOS PENDIENTES'
                    ELSE 'FOTOS COMPLETADAS'
                END as photos_status,
                'VENDIDO EN FOTOS PENDIENTES' as inconsistency_type
            FROM sales_vehicles sv
            LEFT JOIN fotos f ON sv.license_plate = f.license_plate
            WHERE f.license_plate IS NOT NULL 
            AND f.photos_completed = false
            ORDER BY sv.sale_date DESC;
        END;
        $$ LANGUAGE plpgsql;
        
        RAISE NOTICE '✅ Función check_photos_sales_inconsistencies creada exitosamente';
    ELSE
        RAISE NOTICE '✅ Función check_photos_sales_inconsistencies ya existe';
    END IF;
END $$;

-- 3. Verificar si el trigger existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_remove_from_photos_on_sale'
    ) THEN
        RAISE NOTICE '❌ Trigger trigger_remove_from_photos_on_sale no existe. Creándolo...';
        
        -- Crear la función del trigger si no existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'handle_vehicle_sold_remove_from_photos'
        ) THEN
            CREATE OR REPLACE FUNCTION handle_vehicle_sold_remove_from_photos()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Log de inicio
                RAISE NOTICE '🔄 Procesando vehículo vendido: %', NEW.license_plate;
                
                -- Eliminar de la tabla fotos si existe
                DELETE FROM fotos 
                WHERE license_plate = NEW.license_plate;
                
                RAISE NOTICE '✅ Vehículo % eliminado de fotos (vendido)', NEW.license_plate;
                
                RETURN NEW;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '❌ Error eliminando de fotos: %', SQLERRM;
                    RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        END IF;
        
        -- Crear el trigger
        CREATE TRIGGER trigger_remove_from_photos_on_sale
            AFTER INSERT ON sales_vehicles
            FOR EACH ROW
            EXECUTE FUNCTION handle_vehicle_sold_remove_from_photos();
            
        RAISE NOTICE '✅ Trigger trigger_remove_from_photos_on_sale creado exitosamente';
    ELSE
        RAISE NOTICE '✅ Trigger trigger_remove_from_photos_on_sale ya existe';
    END IF;
END $$;

-- 4. Mostrar estado final
SELECT '=== ESTADO FINAL ===' as info;

-- Verificar funciones existentes
SELECT 
    'Funciones de sincronización' as tipo,
    proname as nombre_funcion,
    CASE 
        WHEN proname IN ('sync_photos_with_sales', 'check_photos_sales_inconsistencies', 'handle_vehicle_sold_remove_from_photos') 
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado
FROM pg_proc 
WHERE proname IN ('sync_photos_with_sales', 'check_photos_sales_inconsistencies', 'handle_vehicle_sold_remove_from_photos');

-- Verificar triggers existentes
SELECT 
    'Triggers de sincronización' as tipo,
    tgname as nombre_trigger,
    CASE 
        WHEN tgname = 'trigger_remove_from_photos_on_sale' 
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado
FROM pg_trigger 
WHERE tgname = 'trigger_remove_from_photos_on_sale';

-- Mostrar estadísticas actuales
SELECT 
    'Estadísticas actuales' as info,
    'Vehículos vendidos' as tipo,
    COUNT(*) as cantidad
FROM sales_vehicles

UNION ALL

SELECT 
    'Estadísticas actuales' as info,
    'Vehículos en fotos' as tipo,
    COUNT(*) as cantidad
FROM fotos

UNION ALL

SELECT 
    'Estadísticas actuales' as info,
    'Vehículos vendidos en fotos pendientes' as tipo,
    COUNT(*) as cantidad
FROM sales_vehicles sv
LEFT JOIN fotos f ON sv.license_plate = f.license_plate
WHERE f.license_plate IS NOT NULL 
AND f.photos_completed = false;

-- Comentarios para documentar
COMMENT ON FUNCTION sync_photos_with_sales() IS 'Sincronización manual de fotos con ventas';
COMMENT ON FUNCTION check_photos_sales_inconsistencies() IS 'Verifica inconsistencias entre fotos y ventas';
COMMENT ON FUNCTION handle_vehicle_sold_remove_from_photos() IS 'Elimina automáticamente vehículos de fotos cuando se venden'; 