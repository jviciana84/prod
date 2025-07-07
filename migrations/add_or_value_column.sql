-- Añadir columna or_value a la tabla stock si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'stock'
        AND column_name = 'or_value'
    ) THEN
        ALTER TABLE stock ADD COLUMN or_value TEXT DEFAULT 'ORT';
    END IF;
END
$$;
