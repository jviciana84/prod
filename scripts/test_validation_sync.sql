-- Ver vehículos en sales_vehicles que no están validados
SELECT 
    id,
    license_plate,
    model,
    advisor,
    validated,
    'sales_vehicles' as tabla
FROM sales_vehicles 
WHERE validated = false 
LIMIT 5;

-- Ver qué hay actualmente en pedidos_validados
SELECT 
    COUNT(*) as total_validados,
    'pedidos_validados' as tabla
FROM pedidos_validados;
