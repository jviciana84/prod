-- Hacer un UPDATE más explícito para forzar el trigger
UPDATE public.sales_vehicles
SET updated_at = NOW(),
    cyp_status = 'completado',  -- Forzar el valor
    photo_360_status = 'completado'  -- Forzar el valor
WHERE license_plate = '0010NBB';

-- Verificar si se insertó en entregas
SELECT 'Verificando si se creó en entregas...' as info;

SELECT 
    matricula,
    fecha_venta,
    fecha_entrega,
    modelo,
    asesor,
    "or",
    observaciones,
    created_at
FROM entregas 
WHERE matricula = '0010NBB';

-- Si no existe, verificar si hay errores en los logs
SELECT 'Si no aparece arriba, revisar los NOTICE del trigger' as debug_info;
