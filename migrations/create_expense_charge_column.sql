-- Añadir la columna expense_charge a la tabla stock
ALTER TABLE stock ADD COLUMN expense_charge VARCHAR(100);

-- Verificar que la columna se ha creado correctamente
DO $$
BEGIN
    RAISE NOTICE 'Columna expense_charge creada en la tabla stock';
END $$;
