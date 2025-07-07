-- Crear/reemplazar la función del trigger de forma segura
CREATE OR REPLACE FUNCTION handle_cyp_completion()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'DEBUG: --- Inicio de handle_cyp_completion para matrícula: % ---', NEW.license_plate;
    RAISE NOTICE 'DEBUG: Valores actuales: cyp_status=%, photo_360_status=%, validated=%', NEW.cyp_status, NEW.photo_360_status, NEW.validated;
    RAISE NOTICE 'DEBUG: Valores antiguos: OLD.cyp_status=%', OLD.cyp_status;

    -- Solo actuar si CyP cambia a 'completado'
    -- Y photo_360_status también es 'completado'
    -- Y validated es 'true'
    IF NEW.cyp_status = 'completado' AND (OLD.cyp_status IS NULL OR OLD.cyp_status != 'completado')
       AND NEW.photo_360_status = 'completado'
       AND NEW.validated = 'true' THEN -- Condiciones actualizadas
        
        BEGIN 
            RAISE NOTICE 'DEBUG: Todas las condiciones del trigger se cumplen para matrícula: %', NEW.license_plate;
            
            -- Insertar en entregas, forzando observaciones a NULL desde este trigger
            INSERT INTO entregas (
                fecha_venta,
                fecha_entrega,
                matricula,
                modelo,
                asesor,
                "or",
                incidencia,
                tipos_incidencia,
                observaciones, -- Siempre NULL desde este trigger
                created_at,
                updated_at
            ) VALUES (
                COALESCE(NEW.sale_date, CURRENT_DATE),
                COALESCE(NEW.delivery_date, CURRENT_DATE),
                COALESCE(NEW.license_plate, ''),
                COALESCE(NEW.model, ''),
                COALESCE(NEW.sales_advisor, ''),
                COALESCE(NEW."or", ''),
                false, -- incidencia por defecto
                '{}', -- array vacío de tipos_incidencia
                NULL, -- Forzamos NULL para observaciones desde este trigger
                NOW(),
                NOW()
            )
            ON CONFLICT (matricula) DO UPDATE SET
                fecha_venta = EXCLUDED.fecha_venta,
                fecha_entrega = EXCLUDED.fecha_entrega,
                modelo = EXCLUDED.modelo,
                asesor = EXCLUDED.asesor,
                "or" = EXCLUDED."or",
                observaciones = NULL, -- ¡IMPORTANTE! Forzamos NULL también en caso de UPDATE por conflicto
                updated_at = NOW();
                
            RAISE NOTICE 'DEBUG: Inserción/Actualización en "entregas" completada para matrícula: %', NEW.license_plate;

        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error insertando/actualizando en entregas para matrícula %: % - %', NEW.license_plate, SQLSTATE, SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'DEBUG: Trigger NO activado para matrícula % (Condiciones no cumplidas).', NEW.license_plate;
    END IF;
    
    RAISE NOTICE 'DEBUG: --- Fin de handle_cyp_completion para matrícula: % ---', NEW.license_plate;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS cyp_completion_trigger ON sales_vehicles;

-- Crear el nuevo trigger
CREATE TRIGGER cyp_completion_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_cyp_completion();

-- Verificar que se creó correctamente
SELECT 'Trigger creado correctamente' as status;
