-- Crear un trigger que SIEMPRE se ejecute para debug
SELECT '=== CREANDO TRIGGER DE DEBUG ===' as info;

-- Eliminar trigger anterior
DROP TRIGGER IF EXISTS cyp_to_entregas_trigger_new ON sales_vehicles;

-- Crear función de debug que siempre se ejecuta
CREATE OR REPLACE FUNCTION debug_always_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Este trigger SIEMPRE se ejecuta y registra TODO
    RAISE NOTICE '🔥 TRIGGER DEBUG EJECUTADO: % - OLD.cyp_status=%, NEW.cyp_status=%', 
        NEW.license_plate, 
        COALESCE(OLD.cyp_status, 'NULL'), 
        COALESCE(NEW.cyp_status, 'NULL');
    
    -- Solo procesar si es 0010NBB para debug
    IF NEW.license_plate = '0010NBB' THEN
        RAISE NOTICE '🎯 PROCESANDO 0010NBB: CyP=%, Photo360=%', 
            NEW.cyp_status, NEW.photo_360_status;
            
        -- Si ambos están completados, insertar
        IF NEW.cyp_status = 'completado' AND NEW.photo_360_status = 'completado' THEN
            RAISE NOTICE '✅ INSERTANDO 0010NBB EN ENTREGAS...';
            
            INSERT INTO entregas (
                matricula,
                modelo,
                asesor,
                observaciones,
                created_at,
                updated_at
            ) VALUES (
                '0010NBB',
                'DEBUG TEST',
                'DEBUG ASESOR',
                'Creado por trigger de debug - ' || NOW()::text,
                NOW(),
                NOW()
            )
            ON CONFLICT (matricula) DO UPDATE SET
                observaciones = 'Actualizado por trigger debug - ' || NOW()::text,
                updated_at = NOW();
                
            RAISE NOTICE '🎉 0010NBB INSERTADO/ACTUALIZADO EN ENTREGAS';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que se ejecuta en CUALQUIER UPDATE
CREATE TRIGGER debug_always_trigger
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION debug_always_trigger();

SELECT '✅ Trigger de debug creado - se ejecutará en CUALQUIER UPDATE' as resultado;

-- Probar inmediatamente con un UPDATE simple
UPDATE sales_vehicles 
SET updated_at = NOW()
WHERE license_plate = '0010NBB';

-- Verificar resultado
SELECT 
    'Resultado del trigger de debug:' as info,
    matricula,
    observaciones
FROM entregas 
WHERE matricula = '0010NBB' AND observaciones LIKE '%debug%';
