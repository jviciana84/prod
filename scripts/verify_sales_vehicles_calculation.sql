-- Script para verificar los cálculos de días de preparación VO usando sales_vehicles
-- Este script te permite verificar que los datos se están calculando correctamente

-- 1. Verificar la lógica de estados
SELECT 
  '=== VERIFICACIÓN DE ESTADOS ===' as info;

SELECT 
  license_plate as matricula,
  advisor as asesor,
  sale_date as fecha_venta,
  validation_date as fecha_validacion,
  cyp_date as fecha_cyp,
  photo_360_date as fecha_foto360,
  CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 'COMPLETADO'
    WHEN validation_date IS NOT NULL AND (cyp_date IS NULL OR photo_360_date IS NULL) THEN 'VALIDADO'
    ELSE 'PENDIENTE'
  END as estado_calculado,
  CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 
      GREATEST(cyp_date, photo_360_date)
    ELSE NULL
  END as fecha_completado_calculada
FROM sales_vehicles 
ORDER BY sale_date DESC 
LIMIT 10;

-- 2. Verificar cálculos de días de preparación
SELECT 
  '=== CÁLCULO DE DÍAS DE PREPARACIÓN ===' as info;

SELECT 
  license_plate as matricula,
  advisor as asesor,
  sale_date as fecha_venta,
  validation_date as fecha_validacion,
  cyp_date as fecha_cyp,
  photo_360_date as fecha_foto360,
  CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 
      EXTRACT(DAY FROM (GREATEST(cyp_date, photo_360_date) - sale_date))
    WHEN validation_date IS NOT NULL AND (cyp_date IS NULL OR photo_360_date IS NULL) THEN 
      EXTRACT(DAY FROM (validation_date - sale_date))
    ELSE 0
  END as dias_preparacion_calculados,
  CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 'COMPLETADO'
    WHEN validation_date IS NOT NULL AND (cyp_date IS NULL OR photo_360_date IS NULL) THEN 'VALIDADO'
    ELSE 'PENDIENTE'
  END as estado
FROM sales_vehicles 
WHERE sale_date IS NOT NULL
ORDER BY sale_date DESC 
LIMIT 15;

-- 3. Estadísticas por estado
SELECT 
  '=== ESTADÍSTICAS POR ESTADO ===' as info;

SELECT 
  CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 'COMPLETADO'
    WHEN validation_date IS NOT NULL AND (cyp_date IS NULL OR photo_360_date IS NULL) THEN 'VALIDADO'
    ELSE 'PENDIENTE'
  END as estado,
  COUNT(*) as total_vehiculos,
  COUNT(DISTINCT advisor) as total_asesores,
  AVG(CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 
      EXTRACT(DAY FROM (GREATEST(cyp_date, photo_360_date) - sale_date))
    WHEN validation_date IS NOT NULL AND (cyp_date IS NULL OR photo_360_date IS NULL) THEN 
      EXTRACT(DAY FROM (validation_date - sale_date))
    ELSE 0
  END) as media_dias
FROM sales_vehicles 
WHERE sale_date IS NOT NULL
GROUP BY 
  CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 'COMPLETADO'
    WHEN validation_date IS NOT NULL AND (cyp_date IS NULL OR photo_360_date IS NULL) THEN 'VALIDADO'
    ELSE 'PENDIENTE'
  END
ORDER BY estado;

-- 4. Verificar casos específicos problemáticos
SELECT 
  '=== CASOS ESPECÍFICOS A VERIFICAR ===' as info;

-- Vehículos con CyP pero sin Foto360
SELECT 
  license_plate as matricula,
  advisor as asesor,
  sale_date as fecha_venta,
  validation_date as fecha_validacion,
  cyp_date as fecha_cyp,
  photo_360_date as fecha_foto360,
  'Tiene CyP pero no Foto360' as observacion
FROM sales_vehicles 
WHERE cyp_date IS NOT NULL AND photo_360_date IS NULL
ORDER BY sale_date DESC 
LIMIT 5;

-- Vehículos con Foto360 pero sin CyP
SELECT 
  license_plate as matricula,
  advisor as asesor,
  sale_date as fecha_venta,
  validation_date as fecha_validacion,
  cyp_date as fecha_cyp,
  photo_360_date as fecha_foto360,
  'Tiene Foto360 pero no CyP' as observacion
FROM sales_vehicles 
WHERE photo_360_date IS NOT NULL AND cyp_date IS NULL
ORDER BY sale_date DESC 
LIMIT 5;

-- Vehículos sin fecha de venta
SELECT 
  license_plate as matricula,
  advisor as asesor,
  sale_date as fecha_venta,
  validation_date as fecha_validacion,
  'Sin fecha de venta' as observacion
FROM sales_vehicles 
WHERE sale_date IS NULL
ORDER BY validation_date DESC 
LIMIT 5;

-- 5. Resumen de datos disponibles
SELECT 
  '=== RESUMEN DE DATOS ===' as info;

SELECT 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN sale_date IS NOT NULL THEN 1 END) as con_fecha_venta,
  COUNT(CASE WHEN validation_date IS NOT NULL THEN 1 END) as con_fecha_validacion,
  COUNT(CASE WHEN cyp_date IS NOT NULL THEN 1 END) as con_fecha_cyp,
  COUNT(CASE WHEN photo_360_date IS NOT NULL THEN 1 END) as con_fecha_foto360,
  COUNT(CASE WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 1 END) as completados,
  COUNT(DISTINCT advisor) as total_asesores
FROM sales_vehicles; 