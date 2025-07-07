-- Verificar algunos registros de entregas para ver si tienen referencia a sales_vehicles
SELECT id, matricula, modelo, asesor, fecha_entrega, enviado_a_incentivos
FROM entregas 
WHERE fecha_entrega IS NOT NULL
LIMIT 5;
