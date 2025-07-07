-- Probar manualmente las condiciones del trigger
DO $$
DECLARE
    v_record RECORD;
    v_should_trigger BOOLEAN := FALSE;
BEGIN
    -- Obtener el registro
    SELECT * INTO v_record 
    FROM sales_vehicles 
    WHERE license_plate = '0010NBB';
    
    -- Verificar condiciones
    IF v_record.cyp_status = 'completado' AND v_record.photo_360_status = 'completado' THEN
        v_should_trigger := TRUE;
        RAISE NOTICE 'CONDICIÓN CUMPLIDA: Ambos estados son completado';
    ELSE
        RAISE NOTICE 'CONDICIÓN NO CUMPLIDA: cyp_status=%, photo_360_status=%', 
                     v_record.cyp_status, v_record.photo_360_status;
    END IF;
    
    -- Verificar si ya existe en entregas
    IF EXISTS(SELECT 1 FROM entregas WHERE matricula = v_record.license_plate) THEN
        RAISE NOTICE 'YA EXISTE EN ENTREGAS: %', v_record.license_plate;
        v_should_trigger := FALSE;
    ELSE
        RAISE NOTICE 'NO EXISTE EN ENTREGAS: %', v_record.license_plate;
    END IF;
    
    RAISE NOTICE 'DEBERÍA ACTIVARSE EL TRIGGER: %', v_should_trigger;
END $$;
