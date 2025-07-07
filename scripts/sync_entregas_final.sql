-- Ejecutar la sincronización ahora que la tabla tiene la estructura correcta
SELECT sync_entregas_to_historial();

-- Verificar que se crearon los registros
SELECT 
    matricula,
    tipo_incidencia,
    accion,
    resuelta,
    created_at
FROM incidencias_historial 
ORDER BY created_at DESC;

-- Contar por tipo
SELECT 
    tipo_incidencia,
    COUNT(*) as cantidad
FROM incidencias_historial 
WHERE accion = 'añadida' AND resuelta = false
GROUP BY tipo_incidencia
ORDER BY tipo_incidencia;
