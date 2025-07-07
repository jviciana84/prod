-- OPCIONAL: Limpiar registros de prueba si quieres
-- (Solo ejecuta si quieres borrar las pruebas anteriores)

-- Ver registros actuales
SELECT 
    '📋 Registros actuales en entregas:' as info,
    matricula, 
    fecha_venta,
    fecha_entrega,
    observaciones
FROM entregas 
ORDER BY created_at DESC 
LIMIT 5;

-- DESCOMENTA ESTAS LÍNEAS SI QUIERES BORRAR LAS PRUEBAS:
-- DELETE FROM entregas WHERE observaciones = 'Generado automáticamente desde CyP completado';
-- SELECT '🗑️ Registros de prueba eliminados' as status;
