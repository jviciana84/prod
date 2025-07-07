-- Primero, vamos a verificar la definición actual del trigger
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'nuevas_entradas_to_stock';

-- Ahora vamos a corregir el trigger para asegurarnos de que copie el campo expense_charge
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
            expense_charge  -- Asegurarnos de que este campo está incluido
        ) VALUES (
            NEW.license_plate, 
            NEW.model, 
            COALESCE(NEW.reception_date, NOW()),
            NEW.expense_charge  -- Asegurarnos de que este campo está incluido
        )
        ON CONFLICT (license_plate) 
        DO UPDATE SET 
            model = EXCLUDED.model,
            reception_date = EXCLUDED.reception_date,
            expense_charge = EXCLUDED.expense_charge,  -- Asegurarnos de que este campo está incluido
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
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'nuevas_entradas_to_stock';
