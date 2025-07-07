-- Verificar que todas las tablas y columnas existen
SELECT 'pdf_extracted_data columns' as check_type, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pdf_extracted_data' 
AND column_name IN ('marca', 'color', 'kilometros', 'primera_fecha_matriculacion', 'dealership_code')

UNION ALL

SELECT 'sales_vehicles columns' as check_type, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
AND column_name IN ('color', 'mileage', 'registration_date', 'dealership_code', 'brand')

UNION ALL

SELECT 'dealerships table' as check_type, 'table_exists' as column_name, 'boolean' as data_type
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealerships')

ORDER BY check_type, column_name;

-- Verificar concesionarios
SELECT 'Concesionarios registrados:' as info;
SELECT code, name, cif, active FROM dealerships ORDER BY code;

-- Verificar asesores de ventas
SELECT 'Asesores de ventas registrados:' as info;
SELECT 
    p.full_name,
    p.alias,
    p.email,
    COUNT(sv.id) as ventas_registradas
FROM profiles p
JOIN user_roles ur ON p.id::text = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN sales_vehicles sv ON sv.advisor_id = p.id::text
WHERE r.name = 'Asesor ventas'
GROUP BY p.id, p.full_name, p.alias, p.email
ORDER BY p.full_name;

-- Probar funciones de concesionario
SELECT 'Pruebas de funciones:' as info;
SELECT 'MM' as expected, get_dealership_code('A58800111') as actual;
SELECT 'MMC' as expected, get_dealership_code('B67276543') as actual;
