-- =====================================================
-- ARREGLAR VEHICLE_TYPE EN REGISTROS EXISTENTES
-- =====================================================

-- 1. Actualizar vehicle_type en registros existentes
UPDATE nuevas_entradas 
SET vehicle_type = 'Coche' 
WHERE vehicle_type IS NULL;

-- 2. Verificar el cambio
SELECT '=== REGISTROS ACTUALIZADOS ===' as info;
SELECT 
    id,
    vehicle_type,
    license_plate,
    model,
    purchase_date,
    created_at
FROM nuevas_entradas 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar que no hay registros con vehicle_type NULL
SELECT '=== VERIFICACIÓN ===' as info;
SELECT COUNT(*) as registros_con_vehicle_type_null
FROM nuevas_entradas 
WHERE vehicle_type IS NULL; 