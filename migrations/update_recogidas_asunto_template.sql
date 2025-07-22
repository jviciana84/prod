-- Actualizar el formato del asunto_template en registros existentes
DO $$
BEGIN
    -- Actualizar registros que tengan el formato antiguo
    UPDATE recogidas_email_config 
    SET asunto_template = 'Recogidas Motor Munich ({centro}) - {cantidad} solicitudes'
    WHERE asunto_template = 'Recogidas Motor Munich - {cantidad} solicitudes';
    
    RAISE NOTICE 'Formato de asunto_template actualizado en registros existentes';
END $$; 