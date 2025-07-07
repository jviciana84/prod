-- Crear/reemplazar la función del trigger con un mensaje DEBUG simple
CREATE OR REPLACE FUNCTION public.handle_cyp_to_entregas()
RETURNS TRIGGER AS $$
BEGIN
    -- Este mensaje se imprimirá SIEMPRE que el trigger se dispare
    RAISE NOTICE 'DEBUG: La función handle_cyp_to_entregas ha sido llamada para la matrícula: %', NEW.license_plate;

    -- Aquí iría la lógica original, pero la comentamos temporalmente para esta prueba
    -- IF NEW.cyp_status = 'completado' AND (OLD.cyp_status IS NULL OR OLD.cyp_status != 'completado')
    --    AND NEW.photo_360_status = 'completado'
    --    AND NEW.validated = 'true' THEN
    --
    --    -- Lógica de inserción/actualización en 'entregas'
    --    INSERT INTO entregas (
    --        fecha_venta, fecha_entrega, matricula, modelo, asesor, "or", incidencia, observaciones, created_at, updated_at
    --    ) VALUES (
    --        COALESCE(NEW.sale_date, CURRENT_TIMESTAMP), NULL, COALESCE(NEW.license_plate, ''),
    --        COALESCE(NEW.model, ''), COALESCE(NEW.advisor, ''), COALESCE(NEW.or_value, ''),
    --        false, NULL, NOW(), NOW()
    --    )
    --    ON CONFLICT (matricula) DO UPDATE SET
    --        fecha_venta = EXCLUDED.fecha_venta, fecha_entrega = EXCLUDED.fecha_entrega,
    --        modelo = EXCLUDED.modelo, asesor = EXCLUDED.asesor, "or" = EXCLUDED."or",
    --        observaciones = NULL, updated_at = NOW();
    --
    --    RAISE NOTICE '✅ Vehículo % insertado/actualizado en entregas.', NEW.license_plate;
    -- ELSE
    --    RAISE NOTICE 'ℹ️ Trigger cyp_to_entregas_trigger no se activó para % porque las condiciones no se cumplen. CyP: %, Photo360: %, Validated: %',
    --        NEW.license_plate, NEW.cyp_status, NEW.photo_360_status, NEW.validated;
    -- END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error en handle_cyp_to_entregas: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-adjuntar el trigger para asegurar que usa la nueva definición de la función
-- Esto es importante si la función fue modificada sin que el trigger se actualizara
DROP TRIGGER IF EXISTS cyp_to_entregas_trigger ON sales_vehicles;
CREATE TRIGGER cyp_to_entregas_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cyp_to_entregas();

-- Verificar que se creó correctamente
SELECT 'Función y trigger de depuración actualizados correctamente' as status;
