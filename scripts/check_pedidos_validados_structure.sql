-- Script para verificar la estructura de la tabla sales_vehicles
-- y asegurar que tiene todos los campos necesarios para el informe de días de preparación VO

-- Verificar si la tabla existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'sales_vehicles'
    ) THEN '✅ Tabla sales_vehicles EXISTE'
    ELSE '❌ Tabla sales_vehicles NO EXISTE'
  END as tabla_status;

-- Si la tabla existe, mostrar su estructura
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sales_vehicles'
  ) THEN
    RAISE NOTICE '=== ESTRUCTURA DE LA TABLA sales_vehicles ===';
    
    -- Mostrar columnas existentes
    PERFORM 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sales_vehicles'
    ORDER BY ordinal_position;
    
  ELSE
    RAISE NOTICE 'La tabla sales_vehicles no existe.';
  END IF;
END $$;

-- Verificar campos críticos para el informe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales_vehicles'
AND column_name IN (
  'sale_date',
  'validation_date', 
  'cyp_date',
  'photo_360_date',
  'advisor',
  'license_plate',
  'model'
)
ORDER BY column_name;

-- Contar registros en la tabla
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT advisor) as total_asesores,
  MIN(sale_date) as fecha_venta_mas_antigua,
  MAX(sale_date) as fecha_venta_mas_reciente
FROM sales_vehicles;

-- Mostrar algunos ejemplos de datos
SELECT 
  license_plate,
  advisor,
  sale_date,
  validation_date,
  cyp_date,
  photo_360_date
FROM sales_vehicles 
ORDER BY sale_date DESC 
LIMIT 5; 