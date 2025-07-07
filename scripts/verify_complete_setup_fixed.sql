-- Verificar que todas las tablas y columnas existen
SELECT 'pdf_extracted_data' as tabla, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pdf_extracted_data' 
AND column_name IN ('marca', 'color', 'kilometros', 'primera_fecha_matriculacion', 'dealership_code')

UNION ALL

SELECT 'sales_vehicles' as tabla, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
AND column_name IN ('color', 'mileage', 'registration_date', 'dealership_code', 'brand')

UNION ALL

SELECT 'dealerships' as tabla, 'table_exists' as column_name, 'boolean' as data_type
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealerships')

ORDER BY tabla, column_name;

-- Verificar concesionarios
SELECT 'Concesionarios registrados:' as info, '' as code, '' as name, '' as cif, null as active
UNION ALL
SELECT '', code, name, cif, active::text FROM dealerships ORDER BY code;

-- Verificar asesores de ventas
SELECT 'Asesores de ventas:' as info;
SELECT * FROM list_sales_advisors();

-- Probar funciones de concesionario
SELECT 'Pruebas de funciones:' as info;
SELECT 'Test MM:' as test, get_dealership_code('A58800111') as result;
SELECT 'Test MMC:' as test, get_dealership_code('B67276543') as result;
