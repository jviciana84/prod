-- =====================================================
-- VERIFICAR ESTRUCTURA DE NUEVAS_ENTRADAS
-- =====================================================

-- 1. Ver estructura de nuevas_entradas
SELECT '=== ESTRUCTURA NUEVAS_ENTRADAS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas' 
ORDER BY ordinal_position;

-- 2. Ver datos de ejemplo
SELECT '=== DATOS DE EJEMPLO ===' as info;
SELECT 
    id,
    vehicle_type,
    license_plate,
    model,
    purchase_date,
    is_received,
    status,
    created_at,
    updated_at
FROM nuevas_entradas 
ORDER BY created_at DESC 
LIMIT 3; 