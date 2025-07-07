-- Recrear todo el sistema desde cero
SELECT '=== RECREANDO SISTEMA DESDE CERO ===' as info;

-- 1. Eliminar triggers existentes
DROP TRIGGER IF EXISTS cyp_to_entregas_trigger_simple ON sales_vehicles;
DROP TRIGGER IF EXISTS simple_test_trigger ON sales_vehicles;

-- 2. Eliminar funciones existentes
DROP FUNCTION IF EXISTS handle_cyp_to_entregas_simple();
DROP FUNCTION IF EXISTS handle_simple_trigger();

-- 3. Crear función nueva y simple
CREATE OR REPLACE FUNCTION handle_cyp_to_entregas_new()
RETURNS TRIGGER AS $$
BEGIN
    -- Log de entrada
    RAISE NOTICE '🚀 TRIGGER EJECUTADO para vehículo: %', NEW.license_plate;
    RAISE NOTICE '📊 Estados: CyP=%, Photo360=%', NEW.cyp_status, NEW.photo_360_status;
    
    -- Condición simple: ambos completados
    IF NEW.cyp_status = 'completado' AND NEW.photo_360_status = 'completado' THEN
        
        RAISE NOTICE '✅ CONDICIONES CUMPLIDAS - Insertando en entregas...';
        
        -- Insertar o actualizar en entregas
        INSERT INTO entregas (
            fecha_venta,
            matricula,
            modelo,
            asesor,
            "or",
            incidencia,
            observaciones,
            created_at,
            updated_at
        ) VALUES (
            COALESCE(NEW.sale_date, NOW()),
            NEW.license_plate,
            COALESCE(NEW.model, 'Sin modelo'),
            COALESCE(NEW.advisor, 'Sin asesor'),
            COALESCE(NEW.or_value, 'Sin OR'),
            false,
            'Creado automáticamente por trigger v2',
            NOW(),
            NOW()
        )
        ON CONFLICT (matricula) DO UPDATE SET
            fecha_venta = EXCLUDED.fecha_venta,
            modelo = EXCLUDED.modelo,
            asesor = EXCLUDED.asesor,
            "or" = EXCLUDED."or",
            observaciones = 'Actualizado por trigger v2',
            updated_at = NOW();
            
        RAISE NOTICE '🎉 VEHÍCULO % PROCESADO EXITOSAMENTE', NEW.license_plate;
        
    ELSE
        RAISE NOTICE '⏳ Condiciones no cumplidas para %: CyP=%, Photo360=%', 
            NEW.license_plate, NEW.cyp_status, NEW.photo_360_status;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '💥 ERROR en trigger para %: %', NEW.license_plate, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear trigger nuevo
CREATE TRIGGER cyp_to_entregas_trigger_new
    AFTER UPDATE ON sales_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION handle_cyp_to_entregas_new();

SELECT '✅ SISTEMA RECREADO - Trigger y función nuevos creados' as resultado;

-- 5. Probar inmediatamente
UPDATE sales_vehicles 
SET updated_at = NOW()
WHERE license_plate = '0010NBB';

-- 6. Verificar resultado
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM entregas WHERE matricula = '0010NBB') 
        THEN '🎉 ¡ÉXITO! Registro creado con el nuevo trigger'
        ELSE '❌ Aún no funciona - revisar logs'
    END as resultado_final;
