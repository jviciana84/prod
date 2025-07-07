-- Probar qué columnas existen realmente

-- Ver una muestra de datos para entender la estructura
SELECT *
FROM sales_vehicles 
LIMIT 1;

-- Ver específicamente las columnas que podrían estar relacionadas con CyP
SELECT 
    id,
    CASE 
        WHEN column_exists('sales_vehicles', 'cyp_status') THEN cyp_status::text
        WHEN column_exists('sales_vehicles', 'status') THEN status::text
        ELSE 'no_status_column'
    END as status_value
FROM sales_vehicles 
LIMIT 1;

-- Función helper para verificar si existe una columna
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
    );
END;
$$ LANGUAGE plpgsql;
