-- =====================================================
-- VERIFICAR IMPLEMENTACIÓN IS_SOLD EN STOCK
-- =====================================================
-- Descripción: Verificar que la columna is_sold esté funcionando correctamente
-- =====================================================

-- 1. VERIFICAR QUE LA COLUMNA IS_SOLD EXISTE
SELECT
    'COLUMNA IS_SOLD' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stock'
AND column_name = 'is_sold';

-- 2. CONTAR VEHÍCULOS POR ESTADO DE VENTA
SELECT
    'ESTADOS DE VENTA EN STOCK' as info,
    CASE 
        WHEN is_sold IS NULL THEN 'NULL'
        WHEN is_sold = true THEN 'VENDIDO'
        WHEN is_sold = false THEN 'DISPONIBLE'
    END as estado_venta,
    COUNT(*) as total
FROM stock
GROUP BY is_sold
ORDER BY is_sold;

-- 3. VERIFICAR VEHÍCULOS CON MECHANICAL_STATUS O BODY_STATUS = 'vendido' (INCORRECTO)
SELECT
    'VEHÍCULOS CON STATUS INCORRECTO' as info,
    license_plate,
    model,
    mechanical_status,
    body_status,
    is_sold
FROM stock
WHERE mechanical_status = 'vendido' OR body_status = 'vendido'
ORDER BY reception_date DESC;

-- 4. VERIFICAR VEHÍCULOS VENDIDOS CORRECTAMENTE
SELECT
    'VEHÍCULOS VENDIDOS (IS_SOLD = TRUE)' as info,
    license_plate,
    model,
    reception_date,
    is_sold,
    mechanical_status,
    body_status
FROM stock
WHERE is_sold = true
ORDER BY reception_date DESC
LIMIT 10;

-- 5. VERIFICAR VEHÍCULOS DISPONIBLES
SELECT
    'VEHÍCULOS DISPONIBLES (IS_SOLD = FALSE)' as info,
    license_plate,
    model,
    reception_date,
    is_sold,
    mechanical_status,
    body_status
FROM stock
WHERE is_sold = false
ORDER BY reception_date DESC
LIMIT 10;

-- 6. VERIFICAR TRIGGER
SELECT
    'TRIGGER HANDLE_AVAILABILITY_CHANGE' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_handle_availability_change'; 