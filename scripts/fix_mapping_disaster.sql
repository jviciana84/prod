-- ARREGLAR EL DESASTRE DE MAPEOS

-- 1. Ver qué mapeos existen actualmente
SELECT 'MAPEOS ACTUALES EN user_asesor_mapping:' as info;
SELECT * FROM user_asesor_mapping WHERE active = true;

-- 2. Ver usuarios reales y sus emails
SELECT 'USUARIOS REALES:' as info;
SELECT 
    p.id,
    p.full_name,
    p.role,
    CASE 
        WHEN p.full_name ILIKE '%jordi%' THEN 'Este es Jordi - debería ser JordiVi'
        ELSE 'Otro usuario'
    END as nota
FROM profiles p 
WHERE p.full_name IS NOT NULL
ORDER BY p.full_name;

-- 3. Ver qué asesores existen en entregas
SELECT 'ASESORES EN ENTREGAS:' as info;
SELECT 
    asesor,
    COUNT(*) as entregas_count
FROM entregas 
WHERE asesor IS NOT NULL AND asesor != ''
GROUP BY asesor
ORDER BY entregas_count DESC;

-- 4. LIMPIAR TODO Y EMPEZAR DE CERO
DELETE FROM user_asesor_mapping;

-- 5. CREAR MAPEOS CORRECTOS MANUALMENTE
-- Jordi Viciana = JordiVi (NO RCDE)
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email, active)
SELECT 
    p.id,
    p.full_name,
    'JordiVi',
    'jordi.viciana@munichgroup.es',
    true
FROM profiles p 
WHERE p.full_name ILIKE '%jordi%viciana%'
LIMIT 1;

-- 6. Verificar el mapeo correcto
SELECT 'MAPEO CORRECTO CREADO:' as info;
SELECT * FROM user_asesor_mapping WHERE active = true;

-- 7. Verificar que Jordi puede ver sus entregas
SELECT 'ENTREGAS DE JordiVi:' as info;
SELECT COUNT(*) as total_entregas_jordi
FROM entregas 
WHERE asesor = 'JordiVi';
