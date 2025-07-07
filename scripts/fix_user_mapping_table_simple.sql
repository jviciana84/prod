-- Verificar y arreglar la tabla user_asesor_mapping
SELECT 'Verificando tabla user_asesor_mapping...' as status;

-- Ver si la tabla existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_asesor_mapping'
) as table_exists;

-- Recrear la tabla
DROP TABLE IF EXISTS user_asesor_mapping;

CREATE TABLE user_asesor_mapping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    profile_name TEXT NOT NULL,
    asesor_alias TEXT NOT NULL,
    email TEXT DEFAULT 'Email no disponible',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_user_asesor_mapping_user_id ON user_asesor_mapping(user_id);
CREATE INDEX idx_user_asesor_mapping_asesor_alias ON user_asesor_mapping(asesor_alias);
CREATE INDEX idx_user_asesor_mapping_active ON user_asesor_mapping(active);

-- Desactivar RLS por ahora
ALTER TABLE user_asesor_mapping DISABLE ROW LEVEL SECURITY;

-- Insertar mapeo de prueba para Jordi
INSERT INTO user_asesor_mapping (user_id, profile_name, asesor_alias, email, active)
SELECT 
    p.id,
    p.full_name,
    'JordiVi',
    'viciana84@gmail.com',
    true
FROM profiles p
WHERE p.full_name ILIKE '%jordi%' 
LIMIT 1;

SELECT 'Tabla creada correctamente' as status;

-- Verificar datos
SELECT 
    COUNT(*) as total_mappings,
    COUNT(CASE WHEN active = true THEN 1 END) as active_mappings
FROM user_asesor_mapping;

-- Ver los mapeos creados
SELECT * FROM user_asesor_mapping WHERE active = true;
