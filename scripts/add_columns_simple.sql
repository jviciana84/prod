-- Script simplificado para añadir solo las columnas necesarias

-- Añadir columnas a pdf_extracted_data
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
END $$;

-- Añadir columnas a sales_vehicles
DO $$ 
BEGIN
    -- Añadir columna brand
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_vehicles' AND column_name = 'brand') THEN
        ALTER TABLE sales_vehicles ADD COLUMN brand TEXT;
    END IF;
    
    -- Añadir columna color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_vehicles' AND column_name = 'color') THEN
        ALTER TABLE sales_vehicles ADD COLUMN color TEXT;
    END IF;
    
    -- Añadir columna mileage (kilometros)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_vehicles' AND column_name = 'mileage') THEN
        ALTER TABLE sales_vehicles ADD COLUMN mileage INTEGER;
    END IF;
    
    -- Añadir columna registration_date (primera_fecha_matriculacion)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_vehicles' AND column_name = 'registration_date') THEN
        ALTER TABLE sales_vehicles ADD COLUMN registration_date DATE;
    END IF;
END $$;

-- Verificar que las columnas se han añadido correctamente
SELECT 'pdf_extracted_data' as tabla, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pdf_extracted_data' 
AND column_name IN ('marca', 'color', 'kilometros', 'primera_fecha_matriculacion')

UNION ALL

SELECT 'sales_vehicles' as tabla, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
AND column_name IN ('brand', 'color', 'mileage', 'registration_date')
ORDER BY tabla, column_name;
