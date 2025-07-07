-- 1. Obtener los datos actuales del vehículo
SELECT 'DATOS ACTUALES:' as etapa, license_plate, cyp_status, model, advisor, or_value, sale_date 
FROM sales_vehicles WHERE license_plate = '0010NBB';

-- 2. Ejecutar la función MANUALMENTE simulando OLD y NEW
DO $$
DECLARE
    old_record sales_vehicles%ROWTYPE;
    new_record sales_vehicles%ROWTYPE;
BEGIN
    -- Simular OLD (estado anterior)
    SELECT * INTO old_record FROM sales_vehicles WHERE license_plate = '0010NBB';
    old_record.cyp_status := 'pendiente'; -- Simular que antes estaba pendiente
    
    -- Simular NEW (estado actual)
    SELECT * INTO new_record FROM sales_vehicles WHERE license_plate = '0010NBB';
    new_record.cyp_status := 'completado'; -- Estado actual
    
    -- Ejecutar la lógica del trigger manualmente
    IF new_record.cyp_status = 'completado' AND (old_record.cyp_status IS NULL OR old_record.cyp_status != 'completado') THEN
        
        RAISE NOTICE '🚗 FUNCIÓN MANUAL ACTIVADA para vehículo: %', new_record.license_plate;
        
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
            COALESCE(new_record.sale_date, CURRENT_TIMESTAMP),
            NULL,
            COALESCE(new_record.license_plate, ''),
            COALESCE(new_record.model, ''),
            COALESCE(new_record.advisor, ''),
            COALESCE(new_record.or_value, ''),
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
                
        RAISE NOTICE '✅ FUNCIÓN MANUAL: INSERTADO/ACTUALIZADO en entregas: %', new_record.license_plate;
        
    ELSE
        RAISE NOTICE 'ℹ️ FUNCIÓN MANUAL: NO activada para %. CyP actual: %, CyP anterior: %', new_record.license_plate, new_record.cyp_status, old_record.cyp_status;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR en función manual: %', SQLERRM;
END;
$$;

-- 3. Verificar si se insertó
SELECT 'DESPUÉS DE FUNCIÓN MANUAL:' as etapa, COUNT(*) as cantidad FROM entregas WHERE matricula = '0010NBB';

-- 4. Ver el registro si existe
SELECT * FROM entregas WHERE matricula = '0010NBB';
