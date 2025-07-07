-- Primero verificar qué datos tenemos
SELECT 'Datos actuales del usuario:' as info;
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'jordi.viciana@munichgroup.es';

SELECT 'Datos del perfil:' as info;
SELECT id, full_name, role FROM profiles WHERE id = (
    SELECT id FROM auth.users WHERE email = 'jordi.viciana@munichgroup.es'
);

SELECT 'Entregas con asesor JordiVi:' as info;
SELECT COUNT(*) as total_entregas FROM entregas WHERE asesor = 'JordiVi';

-- Crear/actualizar el mapeo correcto
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_name, email)
SELECT 
    au.id,
    'Jordi Viciana Sánchez',  -- Nombre completo del perfil
    'JordiVi',                -- Alias en la tabla entregas
    'jordi.viciana@munichgroup.es'
FROM auth.users au
WHERE au.email = 'jordi.viciana@munichgroup.es'
ON CONFLICT (user_id) DO UPDATE SET
    profile_name = EXCLUDED.profile_name,
    asesor_name = EXCLUDED.asesor_name,
    updated_at = NOW();

-- Verificar el mapeo creado
SELECT 'Mapeo creado:' as info;
SELECT * FROM user_asesor_mapping WHERE email = 'jordi.viciana@munichgroup.es';
