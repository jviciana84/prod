-- Script de diagnóstico para verificar los cálculos de días de preparación VO
-- Este script te permitirá ver exactamente qué está pasando con los datos

-- 1. Verificar la estructura de la tabla
SELECT '=== ESTRUCTURA DE LA TABLA ===' as info;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales_vehicles' 
AND column_name IN ('sale_date', 'validation_date', 'cyp_date', 'photo_360_date', 'advisor', 'license_plate')
ORDER BY column_name;

-- 2. Verificar datos de ejemplo con todos los campos
SELECT '=== DATOS DE EJEMPLO ===' as info;

SELECT 
  license_plate as matricula,
  advisor as asesor,
  sale_date as fecha_venta,
  validation_date as fecha_validacion,
  cyp_date as fecha_cyp,
  photo_360_date as fecha_foto360,
  CASE 
    WHEN sale_date IS NOT NULL THEN 'SÍ'
    ELSE 'NO'
  END as tiene_fecha_venta,
  CASE 
    WHEN validation_date IS NOT NULL THEN 'SÍ'
    ELSE 'NO'
  END as tiene_fecha_validacion,
  CASE 
    WHEN cyp_date IS NOT NULL THEN 'SÍ'
    ELSE 'NO'
  END as tiene_fecha_cyp,
  CASE 
    WHEN photo_360_date IS NOT NULL THEN 'SÍ'
    ELSE 'NO'
  END as tiene_fecha_foto360
FROM sales_vehicles 
ORDER BY sale_date DESC 
LIMIT 10;

-- 3. Verificar casos específicos de estados
SELECT '=== ANÁLISIS DE ESTADOS ===' as info;

SELECT 
  license_plate,
  advisor,
  sale_date,
  validation_date,
  cyp_date,
  photo_360_date,
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
WHERE sale_date IS NOT NULL
ORDER BY sale_date DESC 
LIMIT 15;

-- 4. Verificar cálculos de días
SELECT '=== CÁLCULOS DE DÍAS ===' as info;

SELECT 
  license_plate,
  advisor,
  sale_date,
  validation_date,
  cyp_date,
  photo_360_date,
  CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 
      GREATEST(cyp_date, photo_360_date)
    ELSE NULL
  END as fecha_completado,
  CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 
      GREATEST(cyp_date, photo_360_date)::date - sale_date::date
    ELSE NULL
  END as dias_venta_completado,
  CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL AND validation_date IS NOT NULL THEN 
      GREATEST(cyp_date, photo_360_date)::date - validation_date::date
    ELSE NULL
  END as dias_validado_completado
FROM sales_vehicles 
WHERE sale_date IS NOT NULL
  AND cyp_date IS NOT NULL 
  AND photo_360_date IS NOT NULL
ORDER BY sale_date DESC 
LIMIT 10;

-- 5. Estadísticas por asesor
SELECT '=== ESTADÍSTICAS POR ASESOR ===' as info;

SELECT 
  advisor as asesor,
  COUNT(*) as total_vehiculos,
  COUNT(CASE WHEN validation_date IS NOT NULL THEN 1 END) as con_validacion,
  COUNT(CASE WHEN cyp_date IS NOT NULL THEN 1 END) as con_cyp,
  COUNT(CASE WHEN photo_360_date IS NOT NULL THEN 1 END) as con_foto360,
  COUNT(CASE WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 1 END) as completados,
  AVG(CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL THEN 
      GREATEST(cyp_date, photo_360_date)::date - sale_date::date
    ELSE NULL
  END) as media_dias_venta_completado,
  AVG(CASE 
    WHEN cyp_date IS NOT NULL AND photo_360_date IS NOT NULL AND validation_date IS NOT NULL THEN 
      GREATEST(cyp_date, photo_360_date)::date - validation_date::date
    ELSE NULL
  END) as media_dias_validado_completado
FROM sales_vehicles 
WHERE sale_date IS NOT NULL
GROUP BY advisor
ORDER BY total_vehiculos DESC;

-- 6. Verificar fechas problemáticas
SELECT '=== FECHAS PROBLEMÁTICAS ===' as info;

SELECT 
  license_plate,
  advisor,
  sale_date,
  validation_date,
  cyp_date,
  photo_360_date,
  CASE 
    WHEN sale_date > validation_date THEN 'VENTA DESPUÉS DE VALIDACIÓN'
    WHEN validation_date > cyp_date THEN 'VALIDACIÓN DESPUÉS DE CYP'
    WHEN validation_date > photo_360_date THEN 'VALIDACIÓN DESPUÉS DE FOTO360'
    WHEN cyp_date > photo_360_date THEN 'CYP DESPUÉS DE FOTO360'
    ELSE 'OK'
  END as problema_fechas
FROM sales_vehicles 
WHERE sale_date IS NOT NULL
  AND (
    sale_date > validation_date OR
    validation_date > cyp_date OR
    validation_date > photo_360_date OR
    cyp_date > photo_360_date
  )
ORDER BY sale_date DESC; 