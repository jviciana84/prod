-- Verificar la estructura de la tabla entregas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'entregas' 
ORDER BY ordinal_position;

-- Verificar algunos registros de ejemplo
SELECT 
    id,
    matricula,
    incidencia,
    tipos_incidencia,
    observaciones
FROM entregas 
LIMIT 5;

-- Verificar tipos de incidencia únicos
SELECT DISTINCT unnest(tipos_incidencia) as tipo_incidencia
FROM entregas 
WHERE tipos_incidencia IS NOT NULL
ORDER BY tipo_incidencia;
