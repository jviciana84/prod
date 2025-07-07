-- PROBAR EL TRIGGER DE ENTREGAS
-- =============================

-- 1. Ver vehículos disponibles para probar
SELECT 
    '🚗 Vehículos disponibles para probar:' as info,
    id,
    license_plate,
    model,
    advisor,
    cyp_status,
    or_value,
    sale_date
FROM sales_vehicles 
WHERE cyp_status != 'completado' 
AND license_plate IS NOT NULL
AND license_plate != ''
LIMIT 5;

-- 2. Contar entregas ANTES de la prueba
SELECT 
    '📊 Entregas antes de la prueba:' as info,
    COUNT(*) as total_entregas 
FROM entregas;

-- 3. Ver las últimas entregas
SELECT 
    '📋 Últimas entregas:' as info,
    matricula,
    modelo,
    asesor,
    fecha_entrega,
    created_at
FROM entregas 
ORDER BY created_at DESC 
LIMIT 3;

-- 4. INSTRUCCIONES PARA PROBAR:
SELECT '
🧪 PARA PROBAR EL TRIGGER:

1. Copia un ID de los vehículos de arriba
2. Ejecuta este comando (reemplaza el ID):

   UPDATE sales_vehicles 
   SET cyp_status = ''completado'', cyp_date = NOW()
   WHERE id = ''REEMPLAZA_CON_ID_REAL'';

3. Luego ejecuta este script otra vez para ver si se insertó en entregas

' as instrucciones;
