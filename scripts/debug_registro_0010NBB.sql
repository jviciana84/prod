-- Ver los valores exactos del registro 0010NBB
SELECT 
    license_plate,
    cyp_status,
    photo_360_status,
    cyp_date,
    photo_360_date,
    sale_date,
    created_at,
    updated_at
FROM sales_vehicles 
WHERE license_plate = '0010NBB';

-- Ver si ya existe en entregas
SELECT 
    matricula,
    fecha_entrega,
    created_at
FROM entregas 
WHERE matricula = '0010NBB';
