-- ARREGLAR DEFINITIVAMENTE EL ALIAS DE JORDI
-- Este script restaura el alias correcto y asegura que el sistema funcione

-- 1. Ver el estado actual
SELECT 'ESTADO ACTUAL DE JORDI:' as info;
SELECT 
    id,
    full_name,
    alias,
    email
FROM profiles 
WHERE full_name ILIKE '%jordi%' OR email = 'jordi.viciana@munichgroup.es';

-- 2. Restaurar el alias correcto (JordiVi con mayúsculas)
UPDATE profiles
SET alias = 'JordiVi'
WHERE full_name ILIKE '%jordi%viciana%' OR email = 'jordi.viciana@munichgroup.es';

-- 3. Verificar el resultado
SELECT 'DESPUÉS DE LA CORRECCIÓN:' as info;
SELECT 
    id,
    full_name,
    alias,
    email
FROM profiles 
WHERE full_name ILIKE '%jordi%' OR email = 'jordi.viciana@munichgroup.es';

-- 4. Verificar que las entregas de JordiVi existen
SELECT 'ENTREGAS DE JordiVi:' as info;
SELECT 
    COUNT(*) as total_entregas,
    MIN(fecha_venta) as primera_entrega,
    MAX(fecha_venta) as ultima_entrega
FROM entregas 
WHERE asesor = 'JordiVi';

-- 5. Crear/actualizar el mapeo en user_asesor_mapping
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email, active)
SELECT 
    p.id,
    p.full_name,
    'JordiVi',
    'jordi.viciana@munichgroup.es',
    true
FROM profiles p
WHERE p.full_name ILIKE '%jordi%viciana%' OR p.email = 'jordi.viciana@munichgroup.es'
ON CONFLICT (user_id, asesor_alias) DO UPDATE SET
    profile_name = EXCLUDED.profile_name,
    email = EXCLUDED.email,
    active = true,
    updated_at = NOW();

-- 6. Verificar el mapeo final
SELECT 'MAPEO FINAL:' as info;
SELECT * FROM user_asesor_mapping WHERE email = 'jordi.viciana@munichgroup.es';

-- 7. Verificar que todo funciona (simulación de la consulta)
SELECT 'SIMULACIÓN DE CONSULTA:' as info;
SELECT 
    COUNT(*) as entregas_encontradas
FROM entregas 
WHERE asesor ILIKE 'JordiVi'; -- Usando ILIKE como en el código

-- 8. Mostrar un resumen final
SELECT 'RESUMEN FINAL:' as info;
SELECT 
    'Jordi Viciana' as usuario,
    'JordiVi' as alias_correcto,
    (SELECT COUNT(*) FROM entregas WHERE asesor = 'JordiVi') as entregas_disponibles,
    'Sistema restaurado' as estado; 