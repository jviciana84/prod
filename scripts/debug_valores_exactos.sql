-- Ver los valores EXACTOS del registro 0010NBB
SELECT 
    'VALORES ACTUALES DE 0010NBB:' as info,
    license_plate,
    cyp_status,
    photo_360_status,
    validated,
    sale_date,
    model,
    advisor,
    or_value
FROM sales_vehicles 
WHERE license_plate = '0010NBB';

-- Ver el tipo de dato de la columna validated
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
AND column_name IN ('cyp_status', 'photo_360_status', 'validated');
