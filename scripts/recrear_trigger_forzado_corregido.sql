-- PASO 1: Eliminar trigger si existe
DROP TRIGGER IF EXISTS cyp_to_entregas_trigger ON sales_vehicles;

-- PASO 2: Eliminar función si existe
DROP FUNCTION IF EXISTS handle_cyp_to_entregas();

-- PASO 3: Crear la función
CREATE OR REPLACE FUNCTION handle_cyp_to_entregas()
RETURNS TRIGGER AS $$
BEGIN
    -- VERSIÓN SIMPLE: Solo cuando CyP cambia a completado
    IF NEW.cyp_status = 'completado' AND (OLD.cyp_status IS NULL OR OLD.cyp_status != 'completado') THEN
        
        RAISE NOTICE '🚗 TRIGGER ACTIVADO para vehículo: %', NEW.license_plate;
        
        -- Insertar en entregas
        INSERT INTO entregas (
            fecha_venta,
            fecha_entrega,
            matricula,
            modelo,
            asesor,
            "or",
            incidencia,
            observaciones,
            created_at,
            updated_at
        ) VALUES (
            COALESCE(NEW.sale_date, CURRENT_TIMESTAMP),
            NULL,
            COALESCE(NEW.license_plate, ''),
            COALESCE(NEW.model, ''),
            COALESCE(NEW.advisor, ''),
            COALESCE(NEW.or_value, ''),
            false,
            '',
            NOW(),
            NOW()
        )
        ON CONFLICT (matricula) DO UPDATE SET
            fecha_venta = EXCLUDED.fecha_venta,
            modelo = EXCLUDED.modelo,
            asesor = EXCLUDED.asesor,
            "or" = EXCLUDED."or",
            updated_at = NOW();
                
        RAISE NOTICE '✅ INSERTADO/ACTUALIZADO en entregas: %', NEW.license_plate;
        
    ELSE
        RAISE NOTICE 'ℹ️ Trigger NO activado para %. CyP actual: %, CyP anterior: %', NEW.license_plate, NEW.cyp_status, OLD.cyp_status;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR en trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 4: Crear el trigger
CREATE TRIGGER cyp_to_entregas_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_cyp_to_entregas();

SELECT 'Trigger recreado correctamente' as status;
