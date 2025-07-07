-- Probar el trigger manualmente

-- Ver un vehículo que tenga cyp_status != 'completado'
SELECT 
    id,
    license_plate,
    model,
    advisor,
    cyp_status,
    or_value
FROM sales_vehicles 
WHERE cyp_status != 'completado' 
LIMIT 1;

-- Si hay alguno, podemos probarlo (reemplaza el ID)
-- UPDATE sales_vehicles 
-- SET cyp_status = 'completado', cyp_date = NOW()
-- WHERE id = 'REEMPLAZA_CON_ID_REAL';

-- Verificar si se insertó en entregas
-- SELECT * FROM entregas WHERE matricula = 'MATRICULA_DEL_VEHICULO';
