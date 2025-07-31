-- Script para verificar vehículos "Completados"
-- Criterio: body_status = "apto" Y mechanical_status = "apto"

SELECT 
  'COMPLETADOS' as tipo,
  COUNT(*) as total_vehiculos
FROM stock 
WHERE body_status = 'apto' 
  AND mechanical_status = 'apto';

-- Mostrar ejemplos de vehículos completados
SELECT 
  'EJEMPLOS_COMPLETADOS' as tipo,
  license_plate,
  model,
  body_status,
  mechanical_status,
  paint_status,
  is_sold,
  reception_date
FROM stock 
WHERE body_status = 'apto' 
  AND mechanical_status = 'apto'
ORDER BY reception_date DESC
LIMIT 10;

-- Verificar distribución de estados
SELECT 
  'DISTRIBUCION_ESTADOS' as tipo,
  body_status,
  mechanical_status,
  COUNT(*) as cantidad
FROM stock 
GROUP BY body_status, mechanical_status
ORDER BY body_status, mechanical_status;

-- Verificar si hay vehículos con body_status = "apto" pero mechanical_status diferente
SELECT 
  'BODY_APTO_OTROS_MECHANICAL' as tipo,
  license_plate,
  model,
  body_status,
  mechanical_status,
  paint_status
FROM stock 
WHERE body_status = 'apto' 
  AND mechanical_status != 'apto'
ORDER BY reception_date DESC
LIMIT 5;

-- Verificar si hay vehículos con mechanical_status = "apto" pero body_status diferente
SELECT 
  'MECHANICAL_APTO_OTROS_BODY' as tipo,
  license_plate,
  model,
  body_status,
  mechanical_status,
  paint_status
FROM stock 
WHERE mechanical_status = 'apto' 
  AND body_status != 'apto'
ORDER BY reception_date DESC
LIMIT 5; 