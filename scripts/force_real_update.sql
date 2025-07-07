-- Forzar un UPDATE que realmente cambie algo
SELECT '=== FORZANDO UPDATE REAL ===' as info;

-- Ver estado actual
SELECT 
    'Estado ANTES del UPDATE:' as info,
    license_plate,
    cyp_status,
    photo_360_status,
    updated_at
FROM sales_vehicles 
WHERE license_plate = '0010NBB';

-- Cambiar algo temporalmente y luego volver a cambiarlo
UPDATE sales_vehicles 
SET cyp_status = 'en_proceso'
WHERE license_plate = '0010NBB';

-- Esperar un momento y volver a completado
UPDATE sales_vehicles 
SET cyp_status = 'completado'
WHERE license_plate = '0010NBB';

-- Ver estado después
SELECT 
    'Estado DESPUÉS del UPDATE:' as info,
    license_plate,
    cyp_status,
    photo_360_status,
    updated_at
FROM sales_vehicles 
WHERE license_plate = '0010NBB';

-- Verificar si ahora se creó en entregas
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM entregas WHERE matricula = '0010NBB' AND observaciones LIKE '%trigger v2%') 
        THEN '🎉 ¡ÉXITO! El trigger funcionó con UPDATE real'
        ELSE '❌ El trigger aún no funciona'
    END as resultado;
