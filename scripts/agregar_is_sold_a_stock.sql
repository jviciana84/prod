-- =====================================================
-- AGREGAR COLUMNA IS_SOLD A STOCK
-- =====================================================
-- Descripción: Agregar columna is_sold para marcar vehículos vendidos
-- =====================================================

-- 1. AGREGAR COLUMNA IS_SOLD
ALTER TABLE stock 
ADD COLUMN is_sold BOOLEAN DEFAULT FALSE;

-- 2. CREAR ÍNDICE PARA OPTIMIZAR BÚSQUEDAS
CREATE INDEX idx_stock_is_sold ON stock(is_sold);

-- 3. VERIFICAR QUE SE AGREGÓ CORRECTAMENTE
SELECT 
    'COLUMNA AGREGADA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stock' 
AND column_name = 'is_sold';

-- 4. MOSTRAR ESTRUCTURA ACTUAL DE STOCK
SELECT 
    'ESTRUCTURA STOCK' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'stock' 
ORDER BY ordinal_position; 