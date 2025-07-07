-- Script para sincronizar manualmente los datos de expense_charge
-- desde nuevas_entradas a stock para los registros existentes

-- Actualizar los registros en stock con los datos de expense_charge de nuevas_entradas
UPDATE stock s
SET expense_charge = ne.expense_charge
FROM nuevas_entradas ne
WHERE s.license_plate = ne.license_plate
AND ne.is_received = TRUE
AND (s.expense_charge IS NULL OR s.expense_charge = '');

-- Verificar cuántos registros se actualizaron
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM stock s
    JOIN nuevas_entradas ne ON s.license_plate = ne.license_plate
    WHERE ne.is_received = TRUE
    AND s.expense_charge IS NOT NULL
    AND s.expense_charge != '';
    
    RAISE NOTICE 'Se han sincronizado % registros con datos de expense_charge', updated_count;
END $$;
