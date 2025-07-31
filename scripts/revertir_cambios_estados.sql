-- SCRIPT PARA REVERTIR CAMBIOS EN DATOS REALES
-- Revertir los cambios hechos por crear_datos_prueba_estados.sql

-- 1. REVERTIR VEHÍCULOS QUE FUERON CAMBIADOS A 'en_proceso'
UPDATE stock
SET
    paint_status = 'pendiente',
    body_status = 'pendiente', 
    mechanical_status = 'pendiente',
    updated_at = NOW()
WHERE license_plate IN ('1090LYX', '2591LNT', '4665MXP');

-- 2. REVERTIR VEHÍCULOS QUE FUERON CAMBIADOS A 'apto'
UPDATE stock
SET
    paint_status = 'pendiente',
    body_status = 'pendiente',
    mechanical_status = 'pendiente', 
    updated_at = NOW()
WHERE license_plate IN ('3972MVR', '6111MNK', '8424MXW');

-- 3. REVERTIR VEHÍCULOS QUE FUERON CAMBIADOS A 'no_apto'
UPDATE stock
SET
    paint_status = 'pendiente',
    body_status = 'pendiente',
    mechanical_status = 'pendiente',
    updated_at = NOW()
WHERE license_plate IN ('1992MPR', '7765MWS');

-- 4. VERIFICAR QUE SE REVIRTIERON LOS CAMBIOS
SELECT
    'VERIFICACIÓN REVERSIÓN' as info,
    license_plate,
    paint_status,
    body_status,
    mechanical_status
FROM stock
WHERE license_plate IN ('1090LYX', '2591LNT', '4665MXP', '3972MVR', '6111MNK', '8424MXW', '1992MPR', '7765MWS')
ORDER BY license_plate; 