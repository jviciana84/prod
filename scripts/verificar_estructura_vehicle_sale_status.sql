-- =====================================================
-- VERIFICACIÓN DE ESTRUCTURA VEHICLE_SALE_STATUS
-- =====================================================

-- 1. VERIFICAR ESTRUCTURA COMPLETA DE LA TABLA
SELECT
    'ESTRUCTURA COMPLETA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'vehicle_sale_status'
ORDER BY ordinal_position;

-- 2. VERIFICAR TODOS LOS REGISTROS PARA ENTENDER LA ESTRUCTURA
SELECT
    'MUESTRA COMPLETA' as info,
    *
FROM vehicle_sale_status
LIMIT 10;

-- 3. VERIFICAR SI HAY ALGUNA COLUMNA QUE CONTENGA 'TYPE' O 'SALE'
SELECT
    'COLUMNAS CON TYPE O SALE' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'vehicle_sale_status'
  AND (column_name ILIKE '%type%' OR column_name ILIKE '%sale%')
ORDER BY column_name;

-- 4. VERIFICAR SI HAY COLUMNAS QUE PUEDAN INDICAR TIPO DE VENTA
SELECT
    'COLUMNAS POSIBLES PARA FILTRAR' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'vehicle_sale_status'
  AND (column_name ILIKE '%professional%'
       OR column_name ILIKE '%retail%'
       OR column_name ILIKE '%tipo%'
       OR column_name ILIKE '%categoria%'
       OR column_name ILIKE '%clase%')
ORDER BY column_name;

-- 5. VERIFICAR VALORES ÚNICOS EN LA COLUMNA SALE_STATUS (si existe)
SELECT
    'VALORES ÚNICOS EN SALE_STATUS' as info,
    sale_status,
    COUNT(*) as cantidad
FROM vehicle_sale_status
GROUP BY sale_status
ORDER BY sale_status;

-- 6. VERIFICAR SI HAY REGISTROS CON SALE_STATUS = 'professional' O SIMILAR
SELECT
    'REGISTROS PROFESIONALES' as info,
    *
FROM vehicle_sale_status
WHERE sale_status ILIKE '%professional%'
   OR sale_status ILIKE '%profesional%'
   OR sale_status ILIKE '%no_retail%'
LIMIT 10; 