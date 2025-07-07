-- EJEMPLO DE PRUEBA MANUAL
-- ========================

-- 1. Buscar un vehículo específico para probar
SELECT 
    '🎯 Vehículo seleccionado para prueba:' as info,
    id,
    license_plate,
    model,
    advisor,
    cyp_status,
    or_value
FROM sales_vehicles 
WHERE cyp_status != 'completado' 
AND license_plate IS NOT NULL
AND license_plate != ''
LIMIT 1;

-- 2. EJECUTAR ESTA ACTUALIZACIÓN (descomenta la línea de abajo)
-- UPDATE sales_vehicles 
-- SET cyp_status = 'completado', cyp_date = NOW()
-- WHERE license_plate = 'REEMPLAZA_CON_MATRICULA_REAL';

-- 3. Verificar que se insertó en entregas
SELECT 
    '✅ Resultado en entregas:' as info,
    matricula,
    modelo,
    asesor,
    fecha_entrega,
    observaciones,
    created_at
FROM entregas 
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Ver logs del trigger (si los hay)
-- Los logs aparecerán en el panel de logs de Supabase
