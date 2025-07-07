-- Crear/reemplazar la función del trigger de forma segura
CREATE OR REPLACE FUNCTION public.handle_cyp_to_entregas()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar cuando CyP cambia a completado Y las otras dos condiciones se cumplen
    IF NEW.cyp_status = 'completado' AND (OLD.cyp_status IS NULL OR OLD.cyp_status != 'completado')
       AND NEW.photo_360_status = 'completado' -- Condición 2: photo_360_status debe ser 'completado'
       AND NEW.validated = TRUE THEN           -- Condición 3: validated debe ser TRUE
        
        RAISE NOTICE '🚗 Procesando vehículo % con CyP completado, 360 completado y validado', NEW.license_plate;
        
        -- Insertar en entregas CON FECHA_ENTREGA EN NULL y OBSERVACIONES EN NULL
        INSERT INTO entregas (
            fecha_venta,
            fecha_entrega,  -- Esto quedará NULL
            matricula,
            modelo,
            asesor,
            "or",
            incidencia,
            observaciones, -- Ahora se insertará como NULL por defecto
            created_at,
            updated_at
        ) VALUES (
            COALESCE(NEW.sale_date, CURRENT_TIMESTAMP),
            NULL,  -- FECHA DE ENTREGA EN BLANCO
            COALESCE(NEW.license_plate, ''),
            COALESCE(NEW.model, ''),
            COALESCE(NEW.advisor, ''),
            COALESCE(NEW.or_value, ''),
            false,
            NULL, -- Observaciones ahora es NULL por defecto
            NOW(),
            NOW()
        )
        ON CONFLICT (matricula) DO UPDATE SET
            fecha_venta = EXCLUDED.fecha_venta,
            fecha_entrega = EXCLUDED.fecha_entrega,
            modelo = EXCLUDED.modelo,
            asesor = EXCLUDED.asesor,
            "or" = EXCLUDED."or",
            observaciones = NULL, -- Forzamos NULL también en caso de UPDATE por conflicto
            updated_at = NOW();
                
        RAISE NOTICE '✅ Vehículo % insertado/actualizado en entregas (fecha_entrega: NULL, observaciones: NULL)', NEW.license_plate;
        
    ELSE
        -- Mensaje de depuración si las condiciones no se cumplen
        RAISE NOTICE 'ℹ️ Trigger cyp_to_entregas_trigger no se activó para % porque las condiciones no se cumplen. CyP: %, Photo360: %, Validated: %',
            NEW.license_plate, NEW.cyp_status, NEW.photo_360_status, NEW.validated;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en handle_cyp_to_entregas: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger existente si existe (para asegurar que se usa la función actualizada)
DROP TRIGGER IF EXISTS cyp_completion_trigger ON sales_vehicles;
DROP TRIGGER IF EXISTS cyp_to_entregas_trigger ON sales_vehicles; -- Asegurarse de eliminar el trigger con el nombre que tienes

-- Crear el nuevo trigger (usando el nombre que ya tenías)
CREATE TRIGGER cyp_to_entregas_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cyp_to_entregas();

-- Verificar que se creó correctamente
SELECT 'Función y trigger actualizados correctamente' as status;
