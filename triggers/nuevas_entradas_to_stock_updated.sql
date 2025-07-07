-- Actualizar el trigger para incluir el campo expense_charge
CREATE OR REPLACE FUNCTION nuevas_entradas_to_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado cambia a 'recibido', insertar en stock
    IF NEW.status = 'recibido' AND (OLD.status IS NULL OR OLD.status <> 'recibido') THEN
        INSERT INTO stock (
            license_plate, 
            model, 
            reception_date,
            expense_charge
        ) VALUES (
            NEW.license_plate, 
            NEW.model, 
            NOW(),
            NEW.expense_charge
        )
        ON CONFLICT (license_plate) 
        DO UPDATE SET 
            model = EXCLUDED.model,
            reception_date = EXCLUDED.reception_date,
            expense_charge = EXCLUDED.expense_charge;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asegurarse de que el trigger existe
DROP TRIGGER IF EXISTS nuevas_entradas_to_stock_trigger ON nuevas_entradas;
CREATE TRIGGER nuevas_entradas_to_stock_trigger
AFTER UPDATE ON nuevas_entradas
FOR EACH ROW
EXECUTE FUNCTION nuevas_entradas_to_stock();
