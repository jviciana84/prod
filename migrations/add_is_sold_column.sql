-- =====================================================
-- MIGRACIÓN: AGREGAR COLUMNA IS_SOLD A TABLA STOCK
-- =====================================================
-- Descripción: Agregar columna is_sold para marcar vehículos vendidos
-- =====================================================

-- 1. AGREGAR COLUMNA IS_SOLD
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT false;

-- 2. VERIFICAR QUE LA COLUMNA SE AGREGÓ CORRECTAMENTE
SELECT 
    'VERIFICACIÓN COLUMNA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stock' 
AND column_name = 'is_sold';

-- 3. ACTUALIZAR VEHÍCULOS VENDIDOS BASÁNDOSE EN FOTOS
UPDATE stock 
SET is_sold = true 
WHERE license_plate IN (
    SELECT DISTINCT license_plate 
    FROM fotos 
    WHERE estado_pintura = 'vendido'
);

-- 4. VERIFICAR RESULTADO
SELECT 
    'RESULTADO ACTUALIZACIÓN' as info,
    COUNT(*) as total_vehiculos,
    COUNT(CASE WHEN is_sold = true THEN 1 END) as vendidos,
    COUNT(CASE WHEN is_sold = false THEN 1 END) as disponibles
FROM stock; 