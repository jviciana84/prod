-- =====================================================
-- REVISAR COLUMNAS DE STOCK
-- =====================================================

-- 1. MOSTRAR TODAS LAS COLUMNAS DE STOCK
SELECT 
    'COLUMNAS STOCK' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'stock' 
ORDER BY ordinal_position;

-- 2. VERIFICAR SI YA EXISTE IS_SOLD
SELECT 
    'BUSCANDO IS_SOLD' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stock' 
AND column_name = 'is_sold';

-- 3. MOSTRAR PRIMERAS FILAS DE STOCK PARA VER ESTRUCTURA
SELECT 
    'MUESTRA STOCK' as info,
    *
FROM stock 
LIMIT 3; 