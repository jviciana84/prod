-- Script para debuggear la ejecución del trigger
DO $$
BEGIN
    RAISE NOTICE '🔧 INICIANDO DEBUG DEL TRIGGER';
    
    -- Verificar que el trigger existe y está activo
    RAISE NOTICE '📋 Triggers activos en sales_vehicles:';
    
    -- Hacer el UPDATE con debug
    RAISE NOTICE '🚀 Ejecutando UPDATE en 0010NBB...';
    
    UPDATE public.sales_vehicles
    SET updated_at = NOW(),
        cyp_status = 'completado',
        photo_360_status = 'completado'
    WHERE license_plate = '0010NBB';
    
    RAISE NOTICE '✅ UPDATE completado';
    
    -- Verificar resultado
    IF EXISTS (SELECT 1 FROM entregas WHERE matricula = '0010NBB') THEN
        RAISE NOTICE '🎉 ¡REGISTRO CREADO EN ENTREGAS!';
    ELSE
        RAISE NOTICE '❌ NO SE CREÓ EL REGISTRO EN ENTREGAS';
    END IF;
    
END $$;

-- Verificar el resultado final
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM entregas WHERE matricula = '0010NBB') 
        THEN '✅ ÉXITO: Registro creado en entregas'
        ELSE '❌ FALLO: No se creó el registro'
    END as resultado;
