-- Script SQL para añadir la columna document_type a la tabla sales_vehicles

-- Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sales_vehicles' 
        AND column_name = 'document_type'
    ) THEN
        -- Añadir la columna document_type
        ALTER TABLE sales_vehicles ADD COLUMN document_type VARCHAR(10);
        
        -- Comentario para la columna
        COMMENT ON COLUMN sales_vehicles.document_type IS 'Tipo de documento (DNI, NIE, CIF)';
    END IF;
END $$;
