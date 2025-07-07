-- Arreglar el trigger para sincronizar expense_charge correctamente
CREATE OR REPLACE FUNCTION nuevas_entradas_to_stock()
RETURNS TRIGGER AS $$
DECLARE
    expense_type_name TEXT;
BEGIN
    -- Si el estado cambia a 'recibido', insertar en stock
    IF NEW.is_received = true AND (OLD.is_received IS NULL OR OLD.is_received = false) THEN
        -- Obtener el nombre del tipo de gasto
        SELECT name INTO expense_type_name 
        FROM expense_types 
        WHERE id = NEW.expense_type_id;
        
        INSERT INTO stock (
            license_plate, 
            model, 
            reception_date,
            expense_type_id,
            expense_charge
        ) VALUES (
            NEW.license_plate, 
            NEW.model, 
            NOW(),
            NEW.expense_type_id,
            COALESCE(NEW.expense_charge, expense_type_name)
        )
        ON CONFLICT (license_plate) 
        DO UPDATE SET 
            model = EXCLUDED.model,
            reception_date = EXCLUDED.reception_date,
            expense_type_id = EXCLUDED.expense_type_id,
            expense_charge = EXCLUDED.expense_charge;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS nuevas_entradas_to_stock_trigger ON nuevas_entradas;
CREATE TRIGGER nuevas_entradas_to_stock_trigger
AFTER UPDATE ON nuevas_entradas
FOR EACH ROW
EXECUTE FUNCTION nuevas_entradas_to_stock();
