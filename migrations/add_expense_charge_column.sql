-- Añadir columna expense_charge a la tabla stock si no existe
ALTER TABLE stock ADD COLUMN IF NOT EXISTS expense_charge VARCHAR(100);

-- Verificar que la columna se ha añadido correctamente
DO $$
BEGIN
    RAISE NOTICE 'Columna expense_charge añadida a la tabla stock';
END $$;
