-- =====================================================
-- VERIFICACIÓN DE ESTADOS EN TABLA STOCK
-- =====================================================

-- 1. VERIFICAR ESTADOS DE PINTURA
SELECT 
    'ESTADOS PINTURA' as info,
    paint_status,
    COUNT(*) as cantidad
FROM stock 
GROUP BY paint_status
ORDER BY paint_status;

-- 2. VERIFICAR ESTADOS DE CARROCERÍA
SELECT 
    'ESTADOS CARROCERÍA' as info,
    body_status,
    COUNT(*) as cantidad
FROM stock 
GROUP BY body_status
ORDER BY body_status;

-- 3. VERIFICAR ESTADOS DE MECÁNICA
SELECT 
    'ESTADOS MECÁNICA' as info,
    mechanical_status,
    COUNT(*) as cantidad
FROM stock 
GROUP BY mechanical_status
ORDER BY mechanical_status;

-- 4. VERIFICAR ESTADOS COMBINADOS
SELECT 
    'ESTADOS COMBINADOS' as info,
    paint_status,
    body_status,
    mechanical_status,
    COUNT(*) as cantidad
FROM stock 
GROUP BY paint_status, body_status, mechanical_status
ORDER BY paint_status, body_status, mechanical_status;

-- 5. VERIFICAR VEHÍCULOS EN PROCESO (deberían tener al menos uno en "en_proceso")
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

-- 6. VERIFICAR VEHÍCULOS COMPLETADOS (deberían tener todos los estados como 'apto' o 'no_apto')
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