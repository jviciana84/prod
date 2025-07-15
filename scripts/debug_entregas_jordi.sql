-- DEBUG: Verificar entregas de Jordi que no aparecen en el dashboard
-- Este script nos ayudará a entender por qué las entregas 1813LVR y 9532LMN no aparecen

-- 1. Buscar las entregas específicas mencionadas
SELECT 
    'ENTREGAS ESPECÍFICAS' as info,
    id,
    matricula,
    asesor,
    fecha_entrega,
    created_at,
    fecha_venta,
    modelo
FROM entregas 
WHERE matricula IN ('1813LVR', '9532LMN')
ORDER BY created_at DESC;

-- 2. Ver todas las entregas de JordiVi (últimas 10)
SELECT 
    'ÚLTIMAS ENTREGAS DE JORDIVI' as info,
    id,
    matricula,
    asesor,
    fecha_entrega,
    created_at,
    fecha_venta,
    modelo
FROM entregas 
WHERE asesor ILIKE 'jordivi'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ver entregas con fecha_entrega (las que aparecen en dashboard)
SELECT 
    'ENTREGAS CON FECHA_ENTREGA (DASHBOARD)' as info,
    id,
    matricula,
    asesor,
    fecha_entrega,
    created_at,
    fecha_venta,
    modelo
FROM entregas 
WHERE fecha_entrega IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Ver entregas SIN fecha_entrega (las que NO aparecen en dashboard)
SELECT 
    'ENTREGAS SIN FECHA_ENTREGA (NO DASHBOARD)' as info,
    id,
    matricula,
    asesor,
    fecha_entrega,
    created_at,
    fecha_venta,
    modelo
FROM entregas 
WHERE fecha_entrega IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5. Contar entregas por estado
SELECT 
    'RESUMEN POR ESTADO' as info,
    COUNT(*) as total_entregas,
    COUNT(CASE WHEN fecha_entrega IS NOT NULL THEN 1 END) as con_fecha_entrega,
    COUNT(CASE WHEN fecha_entrega IS NULL THEN 1 END) as sin_fecha_entrega
FROM entregas;

-- 6. Contar entregas de Jordi por estado
SELECT 
    'RESUMEN JORDIVI POR ESTADO' as info,
    COUNT(*) as total_entregas_jordi,
    COUNT(CASE WHEN fecha_entrega IS NOT NULL THEN 1 END) as con_fecha_entrega,
    COUNT(CASE WHEN fecha_entrega IS NULL THEN 1 END) as sin_fecha_entrega
FROM entregas 
WHERE asesor ILIKE 'jordivi'; 