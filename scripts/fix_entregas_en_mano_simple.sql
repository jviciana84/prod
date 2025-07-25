-- Script SIMPLE para corregir los estados de entregas_en_mano
-- ===========================================================

-- 1. Verificar estructura actual
SELECT 'Estructura actual de la tabla:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'entregas_en_mano'
ORDER BY ordinal_position;

-- 2. Verificar estados actuales
SELECT 'Estados actuales:' as info;
SELECT estado, COUNT(*) as cantidad
FROM entregas_en_mano 
GROUP BY estado;

-- 3. Eliminar constraint existente si existe
ALTER TABLE entregas_en_mano DROP CONSTRAINT IF EXISTS entregas_en_mano_estado_check;

-- 4. Añadir el constraint correcto
ALTER TABLE entregas_en_mano ADD CONSTRAINT entregas_en_mano_estado_check 
CHECK (estado IN ('enviado', 'confirmado', 'cancelado'));

-- 5. Corregir estados incorrectos
UPDATE entregas_en_mano SET estado = 'enviado' WHERE estado = 'solicitada';
UPDATE entregas_en_mano SET estado = 'confirmado' WHERE estado = 'confirmada';
UPDATE entregas_en_mano SET estado = 'enviado' WHERE estado = 'pendiente';

-- 6. Verificar estados después de la corrección
SELECT 'Estados después de la corrección:' as info;
SELECT estado, COUNT(*) as cantidad
FROM entregas_en_mano 
GROUP BY estado;

-- 7. Verificar que el constraint funciona
SELECT 'Verificación del constraint:' as info;
SELECT estado, COUNT(*) as cantidad
FROM entregas_en_mano 
GROUP BY estado
HAVING estado NOT IN ('enviado', 'confirmado', 'cancelado'); 