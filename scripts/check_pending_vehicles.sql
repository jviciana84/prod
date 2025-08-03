-- Script para verificar vehículos pendientes
-- Ejecutar en Supabase SQL Editor

-- Ver todos los vehículos pendientes
SELECT 
    id,
    license_plate,
    assigned_to,
    photos_completed,
    created_at
FROM fotos
WHERE photos_completed = false
ORDER BY created_at DESC;

-- Contar vehículos pendientes con y sin fotógrafo
SELECT 
    COUNT(*) as total_pendientes,
    COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as con_fotografo,
    COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as sin_fotografo
FROM fotos
WHERE photos_completed = false; 