-- =====================================================
-- VERIFICAR TRIGGER AUTOMÁTICO
-- =====================================================

-- 1. Verificar que el trigger existe y está activo
SELECT '=== VERIFICAR TRIGGER AUTOMÁTICO ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'auto_process_duc_scraper'
    AND event_object_table = 'duc_scraper';

-- 2. Verificar que la función del trigger existe
SELECT '=== VERIFICAR FUNCIÓN DEL TRIGGER ===' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs'
    AND routine_schema = 'public';

-- 3. Probar el trigger insertando un vehículo de prueba
SELECT '=== PROBAR TRIGGER CON VEHÍCULO DE PRUEBA ===' as info;

-- Insertar vehículo de prueba en duc_scraper
INSERT INTO duc_scraper (
    "Matrícula",
    "Modelo", 
    "Marca",
    "Disponibilidad",
    "Fecha compra DMS",
    "Precio"
) VALUES (
    'TEST-123',
    'Serie 1',
    'BMW',
    'DISPONIBLE',
    '15-12-2024',
    '25000'
);

-- 4. Verificar que se procesó automáticamente
SELECT '=== VERIFICAR PROCESAMIENTO AUTOMÁTICO ===' as info;
SELECT 
    'Vehículo de prueba en duc_scraper' as info,
    COUNT(*) as total
FROM duc_scraper 
WHERE "Matrícula" = 'TEST-123'
UNION ALL
SELECT 
    'Vehículo de prueba en nuevas_entradas' as info,
    COUNT(*) as total
FROM nuevas_entradas 
WHERE license_plate = 'TEST-123';

-- 5. Mostrar el vehículo de prueba procesado
SELECT '=== VEHÍCULO DE PRUEBA PROCESADO ===' as info;
SELECT 
    license_plate,
    model,
    purchase_date,
    purchase_price,
    CASE 
        WHEN purchase_date IS NULL THEN 'SIN FECHA - COMPLETAR MANUALMENTE'
        ELSE 'CON FECHA'
    END as status
FROM nuevas_entradas 
WHERE license_plate = 'TEST-123';

-- 6. Limpiar vehículo de prueba
SELECT '=== LIMPIAR VEHÍCULO DE PRUEBA ===' as info;
DELETE FROM nuevas_entradas WHERE license_plate = 'TEST-123';
DELETE FROM duc_scraper WHERE "Matrícula" = 'TEST-123';

-- 7. Verificar estado final
SELECT '=== ESTADO FINAL ===' as info;
SELECT 
    'Total vehículos en nuevas_entradas' as info,
    COUNT(*) as total
FROM nuevas_entradas; 