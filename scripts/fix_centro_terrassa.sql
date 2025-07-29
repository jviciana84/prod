-- Script para cambiar "CENTRO TERRASSA" por "Terrassa" en todas las tablas
-- Este script actualiza los registros que tienen "CENTRO TERRASSA" para que usen "Terrassa"

-- 1. Actualizar tabla stock
UPDATE stock 
SET work_center = 'Terrassa', updated_at = NOW()
WHERE work_center = 'CENTRO TERRASSA';

-- 2. Actualizar tabla nuevas_entradas
UPDATE nuevas_entradas 
SET work_center = 'Terrassa', updated_at = NOW()
WHERE work_center = 'CENTRO TERRASSA';

-- 3. Actualizar tabla sales_vehicles
UPDATE sales_vehicles 
SET work_center = 'Terrassa', updated_at = NOW()
WHERE work_center = 'CENTRO TERRASSA';

-- 4. Actualizar tabla pedidos_validados
UPDATE pedidos_validados 
SET work_center = 'Terrassa', updated_at = NOW()
WHERE work_center = 'CENTRO TERRASSA';

-- 5. Actualizar tabla entregas
UPDATE entregas 
SET work_center = 'Terrassa', updated_at = NOW()
WHERE work_center = 'CENTRO TERRASSA';

-- 6. Actualizar tabla fotos
UPDATE fotos 
SET work_center = 'Terrassa', updated_at = NOW()
WHERE work_center = 'CENTRO TERRASSA';

-- Verificar los cambios
SELECT 
    'stock' as tabla,
    COUNT(*) as registros_actualizados
FROM stock 
WHERE work_center = 'Terrassa' AND updated_at > NOW() - INTERVAL '1 minute'

UNION ALL

SELECT 
    'nuevas_entradas' as tabla,
    COUNT(*) as registros_actualizados
FROM nuevas_entradas 
WHERE work_center = 'Terrassa' AND updated_at > NOW() - INTERVAL '1 minute'

UNION ALL

SELECT 
    'sales_vehicles' as tabla,
    COUNT(*) as registros_actualizados
FROM sales_vehicles 
WHERE work_center = 'Terrassa' AND updated_at > NOW() - INTERVAL '1 minute'

UNION ALL

SELECT 
    'pedidos_validados' as tabla,
    COUNT(*) as registros_actualizados
FROM pedidos_validados 
WHERE work_center = 'Terrassa' AND updated_at > NOW() - INTERVAL '1 minute'

UNION ALL

SELECT 
    'entregas' as tabla,
    COUNT(*) as registros_actualizados
FROM entregas 
WHERE work_center = 'Terrassa' AND updated_at > NOW() - INTERVAL '1 minute'

UNION ALL

SELECT 
    'fotos' as tabla,
    COUNT(*) as registros_actualizados
FROM fotos 
WHERE work_center = 'Terrassa' AND updated_at > NOW() - INTERVAL '1 minute';

-- Verificar que no queden registros con "CENTRO TERRASSA"
SELECT 
    'stock' as tabla,
    COUNT(*) as registros_con_centro_terrassa
FROM stock 
WHERE work_center = 'CENTRO TERRASSA'

UNION ALL

SELECT 
    'nuevas_entradas' as tabla,
    COUNT(*) as registros_con_centro_terrassa
FROM nuevas_entradas 
WHERE work_center = 'CENTRO TERRASSA'

UNION ALL

SELECT 
    'sales_vehicles' as tabla,
    COUNT(*) as registros_con_centro_terrassa
FROM sales_vehicles 
WHERE work_center = 'CENTRO TERRASSA'

UNION ALL

SELECT 
    'pedidos_validados' as tabla,
    COUNT(*) as registros_con_centro_terrassa
FROM pedidos_validados 
WHERE work_center = 'CENTRO TERRASSA'

UNION ALL

SELECT 
    'entregas' as tabla,
    COUNT(*) as registros_con_centro_terrassa
FROM entregas 
WHERE work_center = 'CENTRO TERRASSA'

UNION ALL

SELECT 
    'fotos' as tabla,
    COUNT(*) as registros_con_centro_terrassa
FROM fotos 
WHERE work_center = 'CENTRO TERRASSA'; 