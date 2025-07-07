-- Crear función de trigger con condiciones SIMPLES pero correctas
CREATE OR REPLACE FUNCTION handle_cyp_to_entregas_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Mensaje de debug para ver qué valores tenemos
    RAISE NOTICE '🔍 TRIGGER ACTIVADO para %: CyP=%, 360=%, Validated=%', 
        NEW.license_plate, NEW.cyp_status, NEW.photo_360_status, NEW.validated;
    
    -- Condiciones SIMPLES: solo cuando las tres condiciones se cumplen
    IF NEW.cyp_status = 'completado' 
       AND NEW.photo_360_status = 'completado' 
       AND NEW.validated IS TRUE THEN
        
        RAISE NOTICE '✅ CONDICIONES CUMPLIDAS para %', NEW.license_plate;
        
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
            'Creado automáticamente por trigger',
            NOW(),
            NOW()
        )
        ON CONFLICT (matricula) DO UPDATE SET
            fecha_venta = EXCLUDED.fecha_venta,
            modelo = EXCLUDED.modelo,
            asesor = EXCLUDED.asesor,
            "or" = EXCLUDED."or",
            updated_at = NOW();
                
        RAISE NOTICE '🎉 VEHÍCULO % INSERTADO EN ENTREGAS', NEW.license_plate;
        
    ELSE
        RAISE NOTICE '❌ CONDICIONES NO CUMPLIDAS para %', NEW.license_plate;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '💥 ERROR en trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior
DROP TRIGGER IF EXISTS trigger_super_simple ON sales_vehicles;

-- Crear nuevo trigger
CREATE TRIGGER cyp_to_entregas_trigger_simple
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_cyp_to_entregas_simple();

SELECT 'TRIGGER CON CONDICIONES SIMPLES CREADO' as status;
