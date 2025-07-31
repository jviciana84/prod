-- =====================================================
-- INVESTIGACIÓN ESPECÍFICA: VEHÍCULO 8601JTB
-- =====================================================
-- Descripción: Investigar por qué el vehículo 8601JTB aparece como
-- pendiente de fotos si está como "Reservado" en el CSV
-- =====================================================

-- 1. BUSCAR EN DUC_SCRAPER (CSV)
SELECT 
    'DUC_SCRAPER' as tabla,
    "Matrícula",
    "Modelo",
    "Marca",
    "Disponibilidad",
    "Concesionario",
    "Precio",
    last_seen_date,
    import_date
FROM duc_scraper 
WHERE "Matrícula" = '8601JTB';

-- 2. BUSCAR EN STOCK
SELECT 
    'STOCK' as tabla,
    license_plate,
    model,
    mechanical_status,
    body_status,
    reception_date,
    created_at
FROM stock 
WHERE license_plate = '8601JTB';

-- 3. BUSCAR EN FOTOS
SELECT 
    'FOTOS' as tabla,
    license_plate,
    model,
    photos_completed,
    photos_completed_date,
    estado_pintura,
    assigned_to,
    disponible,
    created_at
FROM fotos 
WHERE license_plate = '8601JTB';

-- 4. BUSCAR EN SALES_VEHICLES
SELECT 
    'SALES_VEHICLES' as tabla,
    license_plate,
    model,
    sale_date,
    advisor_name,
    payment_status,
    created_at
FROM sales_vehicles 
WHERE license_plate = '8601JTB';

-- 5. BUSCAR EN VEHICLE_SALE_STATUS
SELECT 
    'VEHICLE_SALE_STATUS' as tabla,
    license_plate,
    sale_status,
    source_table,
    created_at,
    notes
FROM vehicle_sale_status 
WHERE license_plate = '8601JTB';

-- 6. VERIFICAR SI ESTÁ EN NUEVAS_ENTRADAS
SELECT 
    'NUEVAS_ENTRADAS' as tabla,
    license_plate,
    model,
    is_received,
    entry_date,
    created_at
FROM nuevas_entradas 
WHERE license_plate = '8601JTB';

-- 7. ANÁLISIS DEL PROBLEMA
-- Si está en duc_scraper como "Reservado" pero aparece en fotos como pendiente,
-- significa que el trigger no funcionó correctamente

-- 8. VERIFICAR TRIGGERS ACTIVOS
SELECT 
    'TRIGGERS ACTIVOS' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper';

-- 9. VERIFICAR FUNCIONES RELACIONADAS
SELECT 
    'FUNCIONES' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%reserved%' 
   OR routine_name LIKE '%availability%'
   OR routine_name LIKE '%sync%';

-- 10. RECOMENDACIÓN
-- Si el vehículo está en duc_scraper como "Reservado" pero no se movió a vendido,
-- ejecutar manualmente:
-- SELECT handle_availability_change();
-- O verificar si el trigger está funcionando correctamente 