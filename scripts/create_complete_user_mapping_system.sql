-- 1. Crear la tabla de mapeo de usuarios
CREATE TABLE IF NOT EXISTS user_asesor_mapping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_name TEXT NOT NULL, -- El nombre completo en el perfil
    asesor_alias TEXT NOT NULL,  -- El alias como aparece en entregas
    email TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_asesor_mapping_user_id ON user_asesor_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_user_asesor_mapping_email ON user_asesor_mapping(email);
CREATE INDEX IF NOT EXISTS idx_user_asesor_mapping_asesor_alias ON user_asesor_mapping(asesor_alias);
CREATE INDEX IF NOT EXISTS idx_user_asesor_mapping_profile_name ON user_asesor_mapping(profile_name);

-- RLS policies
ALTER TABLE user_asesor_mapping ENABLE ROW LEVEL SECURITY;

-- Policy para que los usuarios puedan ver su propio mapeo
CREATE POLICY "Users can view their own mapping" ON user_asesor_mapping
    FOR SELECT USING (auth.uid() = user_id);

-- Policy para que los admins puedan ver y modificar todos los mapeos
CREATE POLICY "Admins can manage all mappings" ON user_asesor_mapping
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('admin', 'administrador')
        )
    );

-- 2. Ver todos los asesores únicos en la tabla entregas
SELECT 'Asesores únicos en entregas:' as info;
SELECT DISTINCT asesor, COUNT(*) as entregas_count
FROM entregas 
WHERE asesor IS NOT NULL AND asesor != ''
ORDER BY entregas_count DESC;

-- 3. Ver todos los usuarios con sus perfiles
SELECT 'Usuarios con perfiles:' as info;
SELECT 
    au.id as user_id,
    au.email,
    p.full_name,
    p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email IS NOT NULL
ORDER BY au.email;

-- 4. Intentar mapeo automático basado en similitudes
-- Primero, mapeos conocidos/obvios
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email)
SELECT 
    au.id,
    p.full_name,
    'JordiVi',
    au.email
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email = 'jordi.viciana@munichgroup.es'
ON CONFLICT DO NOTHING;

-- 5. Crear mapeos automáticos para otros casos comunes
-- (Esto es una aproximación, puede necesitar ajustes manuales)
WITH asesor_aliases AS (
    SELECT DISTINCT asesor as alias
    FROM entregas 
    WHERE asesor IS NOT NULL AND asesor != ''
),
user_profiles AS (
    SELECT 
        au.id as user_id,
        au.email,
        p.full_name,
        p.role
    FROM auth.users au
    JOIN profiles p ON au.id = p.id
    WHERE p.full_name IS NOT NULL
)
SELECT 
    'Mapeos sugeridos (revisar manualmente):' as info,
    up.email,
    up.full_name,
    aa.alias,
    CASE 
        WHEN LOWER(up.full_name) LIKE '%jordi%' AND aa.alias = 'JordiVi' THEN 'MATCH'
        WHEN LOWER(up.full_name) LIKE '%sara%' AND aa.alias = 'SaraMe' THEN 'MATCH'
        WHEN LOWER(up.full_name) LIKE '%javier%' AND aa.alias = 'JavierCa' THEN 'MATCH'
        ELSE 'MANUAL_REVIEW'
    END as match_type
FROM user_profiles up
CROSS JOIN asesor_aliases aa
WHERE 
    CASE 
        WHEN LOWER(up.full_name) LIKE '%jordi%' AND aa.alias = 'JordiVi' THEN true
        WHEN LOWER(up.full_name) LIKE '%sara%' AND aa.alias = 'SaraMe' THEN true
        WHEN LOWER(up.full_name) LIKE '%javier%' AND aa.alias = 'JavierCa' THEN true
        ELSE false
    END
ORDER BY up.email, aa.alias;

-- 6. Mostrar el estado actual de la tabla de mapeo
SELECT 'Estado actual de mapeos:' as info;
SELECT 
    uam.email,
    uam.profile_name,
    uam.asesor_alias,
    uam.active,
    uam.created_at
FROM user_asesor_mapping uam
ORDER BY uam.email;
