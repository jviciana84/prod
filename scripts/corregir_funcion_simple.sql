-- Corregir la función simple que está actualmente activa
CREATE OR REPLACE FUNCTION public.handle_cyp_to_entregas_simple()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE '🔥 TRIGGER SIMPLE ACTIVADO para matrícula: %', NEW.license_plate;
    
    -- Condiciones: CyP completado Y Photo360 completado
    IF NEW.cyp_status = 'completado' AND NEW.photo_360_status = 'completado' THEN
        
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
            NULL, -- Fecha de entrega en blanco
            COALESCE(NEW.license_plate, ''),
            COALESCE(NEW.model, ''),
            COALESCE(NEW.advisor, ''),
            COALESCE(NEW.or_value, ''),
            false,
            '', -- Observaciones vacías
            NOW(),
            NOW()
        )
        ON CONFLICT (matricula) DO UPDATE SET
            fecha_venta = EXCLUDED.fecha_venta,
            fecha_entrega = NULL,
            modelo = EXCLUDED.modelo,
            asesor = EXCLUDED.asesor,
            "or" = EXCLUDED."or",
            observaciones = '',
            updated_at = NOW();
                
        RAISE NOTICE '🎉 VEHÍCULO % INSERTADO EN ENTREGAS', NEW.license_plate;
        
    ELSE
        RAISE NOTICE '❌ CONDICIONES NO CUMPLIDAS para %: cyp_status=%, photo_360_status=%', 
                     NEW.license_plate, NEW.cyp_status, NEW.photo_360_status;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '💥 ERROR en handle_cyp_to_entregas_simple: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
