-- Probar el trigger corregido
UPDATE public.sales_vehicles
SET updated_at = NOW()
WHERE license_plate = '0010NBB';

-- Verificar si se insertó en entregas
SELECT 'Verificando si se creó en entregas...' as info;

SELECT 
    matricula,
    fecha_venta,
    fecha_entrega,
    modelo,
    asesor,
    observaciones,
    created_at
FROM entregas 
WHERE matricula = '0010NBB';
