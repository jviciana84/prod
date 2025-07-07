-- Primero, eliminamos el trigger existente y su función
DROP TRIGGER IF EXISTS nuevas_entradas_to_stock_trigger ON nuevas_entradas;
DROP FUNCTION IF EXISTS nuevas_entradas_to_stock_function();

-- Creamos una nueva función para el trigger que incluya explícitamente expense_type_id
CREATE OR REPLACE FUNCTION nuevas_entradas_to_stock_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar en la tabla stock cuando se recibe un vehículo
    IF NEW.is_received = TRUE AND (OLD.is_received = FALSE OR OLD.is_received IS NULL) THEN
        INSERT INTO stock (
            license_plate,
            model,
            reception_date,
            paint_status,
            body_status,
            mechanical_status,
            expense_charge,
            expense_type_id  -- Añadimos expense_type_id
        )
        VALUES (
            NEW.license_plate,
            NEW.model,
            NEW.reception_date,
            'pendiente',
            'pendiente',
            'pendiente',
            NEW.expense_charge,
            NEW.expense_type_id  -- Copiamos el valor de expense_type_id
        )
        ON CONFLICT (license_plate) 
        DO UPDATE SET
            model = EXCLUDED.model,
            reception_date = EXCLUDED.reception_date,
            updated_at = NOW(),
            expense_charge = EXCLUDED.expense_charge,
            expense_type_id = EXCLUDED.expense_type_id;  -- Actualizamos expense_type_id en caso de conflicto
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creamos el nuevo trigger
CREATE TRIGGER nuevas_entradas_to_stock_trigger
AFTER INSERT OR UPDATE OF is_received, expense_charge, expense_type_id
ON nuevas_entradas
FOR EACH ROW
EXECUTE FUNCTION nuevas_entradas_to_stock_function();

-- Mensaje de confirmación
SELECT 'Trigger actualizado correctamente con soporte para expense_type_id' as mensaje;
