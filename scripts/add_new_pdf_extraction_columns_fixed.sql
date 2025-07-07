-- Añadir nuevas columnas a la tabla pdf_extracted_data una por una
DO $$ 
BEGIN
    -- Añadir columna marca
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdf_extracted_data' AND column_name = 'marca') THEN
        ALTER TABLE pdf_extracted_data ADD COLUMN marca TEXT;
    END IF;
    
    -- Añadir columna color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdf_extracted_data' AND column_name = 'color') THEN
        ALTER TABLE pdf_extracted_data ADD COLUMN color TEXT;
    END IF;
    
    -- Añadir columna kilometros
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdf_extracted_data' AND column_name = 'kilometros') THEN
        ALTER TABLE pdf_extracted_data ADD COLUMN kilometros INTEGER;
    END IF;
    
    -- Añadir columna primera_fecha_matriculacion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdf_extracted_data' AND column_name = 'primera_fecha_matriculacion') THEN
        ALTER TABLE pdf_extracted_data ADD COLUMN primera_fecha_matriculacion DATE;
    END IF;
    
    -- Añadir columna dealership_code si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pdf_extracted_data' AND column_name = 'dealership_code') THEN
        ALTER TABLE pdf_extracted_data ADD COLUMN dealership_code TEXT;
    END IF;
END $$;

-- Añadir nuevas columnas a la tabla sales_vehicles
DO $$ 
BEGIN
    -- Añadir columna color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_vehicles' AND column_name = 'color') THEN
        ALTER TABLE sales_vehicles ADD COLUMN color TEXT;
    END IF;
    
    -- Añadir columna mileage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_vehicles' AND column_name = 'mileage') THEN
        ALTER TABLE sales_vehicles ADD COLUMN mileage INTEGER;
    END IF;
    
    -- Añadir columna registration_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_vehicles' AND column_name = 'registration_date') THEN
        ALTER TABLE sales_vehicles ADD COLUMN registration_date DATE;
    END IF;
    
    -- Añadir columna brand si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_vehicles' AND column_name = 'brand') THEN
        ALTER TABLE sales_vehicles ADD COLUMN brand TEXT;
    END IF;
    
    -- Añadir columna dealership_code si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_vehicles' AND column_name = 'dealership_code') THEN
        ALTER TABLE sales_vehicles ADD COLUMN dealership_code TEXT;
    END IF;
END $$;

-- Verificar que las columnas se han añadido correctamente
SELECT 'pdf_extracted_data' as tabla, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pdf_extracted_data' 
AND column_name IN ('marca', 'color', 'kilometros', 'primera_fecha_matriculacion', 'dealership_code')

UNION ALL

SELECT 'sales_vehicles' as tabla, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
AND column_name IN ('color', 'mileage', 'registration_date', 'brand', 'dealership_code')
ORDER BY tabla, column_name;
