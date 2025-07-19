-- =====================================================
-- PROBAR TRIGGER INSERTANDO DATO DE PRUEBA
-- =====================================================

-- 1. Ver datos en nuevas_entradas antes
SELECT '=== DATOS EN NUEVAS_ENTRADAS ANTES ===' as info;
SELECT COUNT(*) as total FROM nuevas_entradas;

-- 2. Insertar dato de prueba en duc_scraper (esto debería activar el trigger)
INSERT INTO duc_scraper (
    "ID Anuncio",
    "Matrícula",
    "Modelo",
    "Marca",
    "Disponibilidad",
    "Fecha compra DMS",
    "Precio",
    file_name,
    import_date,
    last_seen_date
) VALUES (
    'TEST-TRIGGER-001',
    'TEST123',
    'Serie 1 Test',
    'BMW',
    'Disponible',
    '2024-01-15',
    '25000',
    'test_trigger.csv',
    NOW(),
    NOW()
);

-- 3. Ver datos en nuevas_entradas después
SELECT '=== DATOS EN NUEVAS_ENTRADAS DESPUÉS ===' as info;
SELECT COUNT(*) as total FROM nuevas_entradas;

-- 4. Ver el nuevo registro añadido
SELECT '=== NUEVO REGISTRO AÑADIDO ===' as info;
SELECT 
    id,
    vehicle_type,
    license_plate,
    model,
    purchase_date,
    created_at
FROM nuevas_entradas 
WHERE license_plate = 'TEST123'
ORDER BY created_at DESC; 