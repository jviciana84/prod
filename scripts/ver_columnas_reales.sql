-- =====================================================
-- VER COLUMNAS REALES DE NUEVAS_ENTRADAS
-- =====================================================

-- Ver todas las columnas de nuevas_entradas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas' 
ORDER BY ordinal_position; 