-- VERIFICAR QUE EL MAPEO DE JORDI ESTÁ CORRECTO

-- 1. Ver el mapeo actual de Jordi
SELECT 'MAPEO ACTUAL DE JORDI:' as info;
SELECT * FROM user_asesor_mapping WHERE active = true;

-- 2. Ver todos los usuarios en profiles
SELECT 'TODOS LOS USUARIOS:' as info;
SELECT 
    id,
    full_name,
    role,
    CASE 
        WHEN full_name ILIKE '%jordi%' THEN '👤 ESTE ES JORDI'
        ELSE ''
    END as es_jordi
FROM profiles 
WHERE full_name IS NOT NULL
ORDER BY full_name;

-- 3. Verificar las entregas de JordiVi
SELECT 'ENTREGAS DE JordiVi (primeras 5):' as info;
SELECT 
    fecha_venta,
    matricula,
    modelo,
    asesor,
    fecha_entrega
FROM entregas 
WHERE asesor = 'JordiVi'
ORDER BY fecha_venta DESC
LIMIT 5;

-- 4. Ver todos los asesores únicos
SELECT 'TODOS LOS ASESORES:' as info;
SELECT 
    asesor,
    COUNT(*) as entregas,
    CASE 
        WHEN asesor = 'JordiVi' THEN '👤 JORDI'
        WHEN asesor = 'RCDE' THEN '🤔 RCDE (¿quién es?)'
        ELSE ''
    END as nota
FROM entregas 
WHERE asesor IS NOT NULL AND asesor != ''
GROUP BY asesor
ORDER BY entregas DESC;
