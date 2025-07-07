-- Probar el trigger manualmente

-- 1. Ver un registro de sales_vehicles para probar
SELECT 
    id,
    license_plate,
    model,
    sales_advisor,
    cyp_status,
    sale_date,
    delivery_date
FROM sales_vehicles 
WHERE cyp_status != 'completado' 
LIMIT 1;

-- 2. Hacer una prueba manual (CAMBIAR EL ID por uno real)
-- UPDATE sales_vehicles 
-- SET cyp_status = 'completado'
-- WHERE id = 'PONER_ID_AQUI';

-- 3. Verificar si se insertó en entregas
-- SELECT * FROM entregas 
-- WHERE matricula = 'MATRICULA_DEL_COCHE_PROBADO'
-- ORDER BY created_at DESC;

-- 4. Revertir el cambio si es necesario
-- UPDATE sales_vehicles 
-- SET cyp_status = 'pendiente'  -- o el estado que tenía antes
-- WHERE id = 'PONER_ID_AQUI';
