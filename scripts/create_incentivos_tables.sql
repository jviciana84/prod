-- Crear tabla para tipos de incentivos
CREATE TABLE IF NOT EXISTS tipos_incentivos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    puntos_base INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para incentivos otorgados
CREATE TABLE IF NOT EXISTS incentivos_otorgados (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id),
    tipo_incentivo_id INTEGER REFERENCES tipos_incentivos(id),
    puntos INTEGER NOT NULL,
    motivo TEXT,
    fecha_otorgado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    otorgado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para metas de usuarios
CREATE TABLE IF NOT EXISTS metas_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id),
    tipo_meta VARCHAR(50) NOT NULL,
    objetivo INTEGER NOT NULL,
    progreso INTEGER DEFAULT 0,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    completada BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar algunos tipos de incentivos básicos
INSERT INTO tipos_incentivos (nombre, descripcion, puntos_base) VALUES
('Puntualidad', 'Incentivo por llegar puntual al trabajo', 10),
('Productividad', 'Incentivo por superar objetivos de productividad', 25),
('Calidad', 'Incentivo por mantener altos estándares de calidad', 20),
('Trabajo en equipo', 'Incentivo por colaboración excepcional', 15),
('Innovación', 'Incentivo por proponer mejoras o ideas innovadoras', 30)
ON CONFLICT (nombre) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE tipos_incentivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentivos_otorgados ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de seguridad (todos pueden leer, solo admins pueden escribir)
CREATE POLICY "Todos pueden ver tipos de incentivos" ON tipos_incentivos FOR SELECT USING (true);
CREATE POLICY "Solo admins pueden gestionar tipos de incentivos" ON tipos_incentivos FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Todos pueden ver incentivos otorgados" ON incentivos_otorgados FOR SELECT USING (true);
CREATE POLICY "Solo admins pueden otorgar incentivos" ON incentivos_otorgados FOR INSERT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Usuarios pueden ver sus metas" ON metas_usuarios FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Solo admins pueden gestionar metas" ON metas_usuarios FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
