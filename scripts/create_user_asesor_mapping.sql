-- Crear tabla para mapear usuarios con sus nombres de asesor
CREATE TABLE IF NOT EXISTS user_asesor_mapping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_name TEXT NOT NULL, -- El nombre en el perfil (ej: "JordiVi")
    asesor_name TEXT NOT NULL,  -- El nombre como aparece en entregas (ej: "Jordi Viciana")
    email TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_asesor_mapping_user_id ON user_asesor_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_user_asesor_mapping_email ON user_asesor_mapping(email);
CREATE INDEX IF NOT EXISTS idx_user_asesor_mapping_asesor_name ON user_asesor_mapping(asesor_name);

-- RLS policies
ALTER TABLE user_asesor_mapping ENABLE ROW LEVEL SECURITY;

-- Policy para que los usuarios puedan ver su propio mapeo
CREATE POLICY "Users can view their own mapping" ON user_asesor_mapping
    FOR SELECT USING (auth.uid() = user_id);

-- Policy para que los admins puedan ver todos los mapeos
CREATE POLICY "Admins can view all mappings" ON user_asesor_mapping
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('admin', 'administrador')
        )
    );

-- Insertar el mapeo para Jordi
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_name, email)
SELECT 
    au.id,
    'JordiVi',
    'Jordi Viciana',
    'jordi.viciana@munichgroup.es'
FROM auth.users au
WHERE au.email = 'jordi.viciana@munichgroup.es'
ON CONFLICT DO NOTHING;

-- Verificar qué nombres de asesor existen en la tabla entregas
SELECT DISTINCT asesor, COUNT(*) as count
FROM entregas 
WHERE asesor IS NOT NULL AND asesor != ''
ORDER BY count DESC;
