-- Corregir la función para el trigger que copia datos de nuevas_entradas a stock
CREATE OR REPLACE FUNCTION nuevas_entradas_to_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se marca como recibido y no existe en stock, insertar
    IF NEW.is_received = TRUE AND (OLD.is_received = FALSE OR OLD.is_received IS NULL) THEN
        INSERT INTO stock (license_plate, model, reception_date)
        VALUES (NEW.license_plate, NEW.model, COALESCE(NEW.reception_date, NOW()))
        ON CONFLICT (license_plate) 
        DO UPDATE SET 
            model = EXCLUDED.model,
            reception_date = EXCLUDED.reception_date,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger para copiar datos
DROP TRIGGER IF EXISTS nuevas_entradas_to_stock_trigger ON nuevas_entradas;
CREATE TRIGGER nuevas_entradas_to_stock_trigger
AFTER UPDATE ON nuevas_entradas
FOR EACH ROW
EXECUTE FUNCTION nuevas_entradas_to_stock();
