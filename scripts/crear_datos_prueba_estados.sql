-- =====================================================
-- CREAR DATOS DE PRUEBA PARA ESTADOS
-- =====================================================

-- 1. ACTUALIZAR ALGUNOS VEHÍCULOS A 'en_proceso'
UPDATE stock
SET
    paint_status = 'en_proceso',
    body_status = 'en_proceso',
    mechanical_status = 'en_proceso',
    updated_at = NOW()
WHERE license_plate IN ('1090LYX', '2591LNT', '4665MXP');

-- 2. ACTUALIZAR ALGUNOS VEHÍCULOS A 'apto' (completados)
UPDATE stock
SET
    paint_status = 'apto',
    body_status = 'apto',
    mechanical_status = 'apto',
    updated_at = NOW()
WHERE license_plate IN ('3972MVR', '6111MNK', '8424MXW');

-- 3. ACTUALIZAR ALGUNOS VEHÍCULOS A 'no_apto' (completados pero no aptos)
UPDATE stock
SET
    paint_status = 'no_apto',
    body_status = 'no_apto',
    mechanical_status = 'no_apto',
    updated_at = NOW()
WHERE license_plate IN ('1992MPR', '7765MWS');

-- 4. VERIFICAR LOS CAMBIOS
SELECT
    'ESTADOS DESPUÉS DE ACTUALIZACIÓN' as info,
    paint_status,
    body_status,
    mechanical_status,
    COUNT(*) as cantidad
FROM stock
GROUP BY paint_status, body_status, mechanical_status
ORDER BY paint_status, body_status, mechanical_status;

-- 5. VERIFICAR VEHÍCULOS EN PROCESO
SELECT
    'VEHÍCULOS EN PROCESO' as info,
    license_plate,
    model,
    paint_status,
    body_status,
    mechanical_status
FROM stock
WHERE paint_status = 'en_proceso'
   OR body_status = 'en_proceso'
   OR mechanical_status = 'en_proceso'
ORDER BY license_plate;

-- 6. VERIFICAR VEHÍCULOS COMPLETADOS
SELECT
    'VEHÍCULOS COMPLETADOS' as info,
    license_plate,
    model,
    paint_status,
    body_status,
    mechanical_status
FROM stock
WHERE (paint_status = 'apto' OR paint_status = 'no_apto')
  AND (body_status = 'apto' OR body_status = 'no_apto')
  AND (mechanical_status = 'apto' OR mechanical_status = 'no_apto')
ORDER BY license_plate; 