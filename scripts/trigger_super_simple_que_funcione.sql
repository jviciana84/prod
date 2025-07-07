-- PASO 1: Crear función de trigger súper simple (sin condiciones complicadas)
CREATE OR REPLACE FUNCTION handle_simple_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo insertar cuando se actualiza cualquier registro (sin condiciones)
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
        NOW(),
        NULL,
        'TRIGGER_' || NEW.license_plate,
        COALESCE(NEW.model, 'SIN MODELO'),
        COALESCE(NEW.advisor, 'SIN ASESOR'),
        COALESCE(NEW.or_value, 'SIN OR'),
        false,
        'Creado por trigger simple',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '🚗 TRIGGER SIMPLE EJECUTADO para matrícula: %', NEW.license_plate;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR en trigger simple: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 2: Eliminar triggers existentes
DROP TRIGGER IF EXISTS cyp_completion_trigger ON sales_vehicles;
DROP TRIGGER IF EXISTS cyp_to_entregas_trigger ON sales_vehicles;

-- PASO 3: Crear trigger súper simple
CREATE TRIGGER simple_test_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_simple_trigger();

SELECT 'TRIGGER SÚPER SIMPLE CREADO' as status;
