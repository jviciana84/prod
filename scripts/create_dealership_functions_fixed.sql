-- Función para obtener el código del concesionario basado en el CIF
CREATE OR REPLACE FUNCTION get_dealership_code(cif_input TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Limpiar el CIF de espacios y guiones
    cif_input := UPPER(REPLACE(REPLACE(cif_input, ' ', ''), '-', ''));
    
    -- Buscar en la tabla de concesionarios
    RETURN (
        SELECT code 
        FROM dealerships 
        WHERE UPPER(REPLACE(REPLACE(cif, ' ', ''), '-', '')) = cif_input
        AND active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener información completa del concesionario
CREATE OR REPLACE FUNCTION get_dealership_info(cif_input TEXT)
RETURNS TABLE(
    dealership_code TEXT,
    dealership_name TEXT,
    dealership_cif TEXT,
    dealership_address TEXT,
    dealership_city TEXT
) AS $$
BEGIN
    -- Limpiar el CIF de espacios y guiones
    cif_input := UPPER(REPLACE(REPLACE(cif_input, ' ', ''), '-', ''));
    
    RETURN QUERY
    SELECT 
        d.code,
        d.name,
        d.cif,
        d.address,
        d.city
    FROM dealerships d
    WHERE UPPER(REPLACE(REPLACE(d.cif, ' ', ''), '-', '')) = cif_input
    AND d.active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Probar las funciones
SELECT get_dealership_code('A58800111') as mm_code;
SELECT get_dealership_code('B67276543') as mmc_code;

SELECT * FROM get_dealership_info('A58800111');
