-- Crear/reemplazar la función del trigger de forma segura
CREATE OR REPLACE FUNCTION public.handle_cyp_to_entregas()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar cuando CyP cambia a completado Y las otras dos condiciones se cumplen
    -- NOTA: NEW.validated se compara con la cadena 'true' porque la columna es de tipo TEXTO
    IF NEW.cyp_status = 'completado' AND (OLD.cyp_status IS NULL OR OLD.cyp_status != 'completado')
       AND NEW.photo_360_status = 'completado'
       AND NEW.validated = 'true' THEN
        
        RAISE NOTICE '🚗 Procesando vehículo % con CyP completado, 360 completado y validado (string)', NEW.license_plate;
        
        -- Insertar en entregas, manteniendo fecha_entrega como NULL y observaciones como ''
        INSERT INTO entregas (
            fecha_venta,
            fecha_entrega, -- Se inserta NULL aquí, según tu indicación
            matricula,
            modelo,
            asesor,
            "or",
            incidencia,
            observaciones, -- Se inserta '' aquí, según tu indicación
            created_at,
            updated_at
        ) VALUES (
            COALESCE(NEW.sale_date, CURRENT_TIMESTAMP),
            NULL, -- Fecha de entrega es NULL
            COALESCE(NEW.license_plate, ''),
            COALESCE(NEW.model, ''),
            COALESCE(NEW.advisor, ''),
            COALESCE(NEW.or_value, ''),
            false,
            '', -- Observaciones es cadena vacía
            NOW(),
            NOW()
        )
        ON CONFLICT (matricula) DO UPDATE SET
            fecha_venta = EXCLUDED.fecha_venta,
            fecha_entrega = NULL, -- Se actualiza a NULL
            modelo = EXCLUDED.modelo,
            asesor = EXCLUDED.asesor,
            "or" = EXCLUDED."or",
            incidencia = EXCLUDED.incidencia,
            observaciones = '', -- Se actualiza a ''
            updated_at = NOW();
                
        RAISE NOTICE '✅ Vehículo % insertado/actualizado en entregas (fecha_entrega: NULL, observaciones: "")', NEW.license_plate;
        
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
DROP TRIGGER IF EXISTS cyp_to_entregas_trigger ON sales_vehicles;

-- Crear el nuevo trigger (usando el nombre que ya tenías)
CREATE TRIGGER cyp_to_entregas_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cyp_to_entregas();

-- Verificar que se creó correctamente
SELECT 'Función y trigger actualizados correctamente' as status;
