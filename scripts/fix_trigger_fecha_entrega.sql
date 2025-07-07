-- CORREGIR TRIGGER - FECHA DE ENTREGA EN BLANCO
-- =============================================

-- Actualizar la función para dejar fecha_entrega en NULL
CREATE OR REPLACE FUNCTION handle_cyp_to_entregas()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar cuando CyP cambia a completado
    IF NEW.cyp_status = 'completado' AND (OLD.cyp_status IS NULL OR OLD.cyp_status != 'completado') THEN
        
        RAISE NOTICE '🚗 Procesando vehículo % con CyP completado', NEW.license_plate;
        
        -- Insertar en entregas CON FECHA_ENTREGA EN NULL
        INSERT INTO entregas (
            fecha_venta,
            fecha_entrega,  -- ← ESTO QUEDARÁ NULL
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
            NULL,  -- ← FECHA DE ENTREGA EN BLANCO
            COALESCE(NEW.license_plate, ''),
            COALESCE(NEW.model, ''),
            COALESCE(NEW.advisor, ''),
            COALESCE(NEW.or_value, ''),
            false,
            'Generado automáticamente desde CyP completado',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Vehículo % insertado en entregas (fecha_entrega: NULL)', NEW.license_plate;
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error insertando en entregas: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar que se actualizó
SELECT '✅ Función actualizada - fecha_entrega quedará en NULL' as status;
