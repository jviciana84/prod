-- Probar la función manualmente
SELECT '=== PRUEBA MANUAL DE LA FUNCIÓN ===' as info;

-- Crear un registro temporal para probar
DO $$
DECLARE
    test_record RECORD;
BEGIN
    -- Obtener el registro actual
    SELECT * INTO test_record FROM sales_vehicles WHERE license_plate = '0010NBB';
    
    RAISE NOTICE '🔍 Datos del registro: license_plate=%, cyp_status=%, photo_360_status=%', 
        test_record.license_plate, test_record.cyp_status, test_record.photo_360_status;
    
    -- Probar las condiciones manualmente
    IF test_record.cyp_status = 'completado' AND test_record.photo_360_status = 'completado' THEN
        RAISE NOTICE '✅ CONDICIONES SE CUMPLEN - Intentando insertar...';
        
        -- Intentar insertar manualmente
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
            COALESCE(test_record.sale_date, CURRENT_TIMESTAMP),
            NULL,
            COALESCE(test_record.license_plate, ''),
            COALESCE(test_record.model, ''),
            COALESCE(test_record.advisor, ''),
            COALESCE(test_record.or_value, ''),
            false,
            'Insertado manualmente para prueba',
            NOW(),
            NOW()
        )
        ON CONFLICT (matricula) DO UPDATE SET
            fecha_venta = EXCLUDED.fecha_venta,
            modelo = EXCLUDED.modelo,
            asesor = EXCLUDED.asesor,
            "or" = EXCLUDED."or",
            observaciones = 'Actualizado manualmente para prueba',
            updated_at = NOW();
            
        RAISE NOTICE '🎉 INSERCIÓN MANUAL EXITOSA';
        
    ELSE
        RAISE NOTICE '❌ CONDICIONES NO SE CUMPLEN: cyp_status=%, photo_360_status=%', 
            test_record.cyp_status, test_record.photo_360_status;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '💥 ERROR EN INSERCIÓN MANUAL: %', SQLERRM;
END $$;

-- Verificar si se insertó
SELECT 'RESULTADO DE INSERCIÓN MANUAL:' as info;
SELECT matricula, observaciones, created_at 
FROM entregas 
WHERE matricula = '0010NBB';
