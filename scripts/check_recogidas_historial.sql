-- Verificar si hay datos en recogidas_historial
SELECT 
    COUNT(*) as total_recogidas,
    MIN(fecha_solicitud) as fecha_mas_antigua,
    MAX(fecha_solicitud) as fecha_mas_reciente
FROM recogidas_historial;

-- Mostrar algunas recogidas de ejemplo
SELECT 
    id,
    matricula,
    nombre_cliente,
    usuario_solicitante,
    fecha_solicitud,
    estado
FROM recogidas_historial 
ORDER BY fecha_solicitud DESC 
LIMIT 5; 