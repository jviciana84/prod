-- Script para limpiar valores incorrectos en work_center
-- Este script cambia valores que no son centros de trabajo válidos por "Terrassa"

-- 1. Verificar qué valores incorrectos hay en work_center
SELECT 
    work_center,
    COUNT(*) as cantidad
FROM stock 
WHERE work_center IS NOT NULL 
    AND work_center NOT IN ('Terrassa', 'Sabadell', 'Vilanova', 'Sant Fruitos', 'Externo')
GROUP BY work_center
ORDER BY cantidad DESC;

-- 2. Actualizar valores incorrectos a "Terrassa"
UPDATE stock 
SET 
    work_center = 'Terrassa',
    updated_at = NOW()
WHERE work_center IS NOT NULL 
    AND work_center NOT IN ('Terrassa', 'Sabadell', 'Vilanova', 'Sant Fruitos', 'Externo');

-- 3. Verificar que se limpiaron
SELECT 
    work_center,
    COUNT(*) as cantidad
FROM stock 
WHERE work_center IS NOT NULL
GROUP BY work_center
ORDER BY cantidad DESC;

-- 4. Verificar que no quedan valores incorrectos
SELECT 
    license_plate,
    work_center
FROM stock 
WHERE work_center IS NOT NULL 
    AND work_center NOT IN ('Terrassa', 'Sabadell', 'Vilanova', 'Sant Fruitos', 'Externo')
LIMIT 10; 