-- Primero, vamos a verificar el trigger existente
DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'nuevas_entradas_to_stock_trigger'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE 'El trigger nuevas_entradas_to_stock_trigger existe';
    ELSE
        RAISE NOTICE 'El trigger nuevas_entradas_to_stock_trigger NO existe';
    END IF;
END $$;

-- Eliminar el trigger y la función si existen para recrearlos
DROP TRIGGER IF EXISTS nuevas_entradas_to_stock_trigger ON nuevas_entradas;
DROP FUNCTION IF EXISTS nuevas_entradas_to_stock();

-- Crear la función actualizada
CREATE OR REPLACE FUNCTION nuevas_entradas_to_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar si el estado cambia a recibido
    IF NEW.is_received = TRUE AND (OLD.is_received = FALSE OR OLD.is_received IS NULL) THEN
        -- Insertar o actualizar en la tabla stock
        INSERT INTO stock (
            license_plate, 
            model, 
            reception_date,
            expense_charge
        ) VALUES (
            NEW.license_plate, 
            NEW.model, 
            COALESCE(NEW.reception_date, NOW()),
            NEW.expense_charge
        )
        ON CONFLICT (license_plate) 
        DO UPDATE SET 
            model = EXCLUDED.model,
            reception_date = EXCLUDED.reception_date,
            expense_charge = EXCLUDED.expense_charge,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
CREATE TRIGGER nuevas_entradas_to_stock_trigger
AFTER UPDATE OR INSERT ON nuevas_entradas
FOR EACH ROW
EXECUTE FUNCTION nuevas_entradas_to_stock();

-- Verificar que el trigger se ha creado correctamente
DO $$
BEGIN
    RAISE NOTICE 'Trigger nuevas_entradas_to_stock_trigger creado o actualizado';
END $$;
