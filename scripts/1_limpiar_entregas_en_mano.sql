-- Script 1: LIMPIAR ENTREGAS EN MANO Y HISTORIAL
-- ================================================

-- Limpiar tabla entregas_en_mano
DELETE FROM entregas_en_mano;
ALTER SEQUENCE entregas_en_mano_id_seq RESTART WITH 1;

-- Limpiar tabla recogidas_historial
DELETE FROM recogidas_historial;
ALTER SEQUENCE recogidas_historial_id_seq RESTART WITH 1;

-- Limpiar tabla incidencias_historial (opcional, solo si quieres limpiar todo)
-- DELETE FROM incidencias_historial;

-- Verificar que se limpiaron correctamente
SELECT 'Verificación de limpieza:' as info;

SELECT 
    'entregas_en_mano' as tabla,
    COUNT(*) as registros
FROM entregas_en_mano
UNION ALL
SELECT 
    'recogidas_historial' as tabla,
    COUNT(*) as registros
FROM recogidas_historial;

-- Mostrar secuencias actuales
SELECT 
    'Secuencias actuales:' as info;

SELECT 
    sequence_name,
    last_value,
    is_called
FROM information_schema.sequences 
WHERE sequence_name IN ('entregas_en_mano_id_seq', 'recogidas_historial_id_seq');

-- Resumen
SELECT '✅ LIMPIEZA COMPLETADA' as status;
SELECT 'Las tablas entregas_en_mano y recogidas_historial han sido limpiadas completamente' as info; 