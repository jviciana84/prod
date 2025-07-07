-- Crear la tabla roles si no existe, con id de tipo TEXT
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar roles si no existen o actualizar sus nombres/descripciones
-- **AJUSTA ESTOS IDs Y NOMBRES SEGÚN TUS ROLES REALES EN LA TABLA 'roles'**
INSERT INTO public.roles (id, name, description)
VALUES
    ('1', 'admin', 'Usuario con permisos de administrador total'),
    ('2', 'asesor', 'Usuario con permisos de asesor de ventas'),
    ('13', 'photographer', 'Usuario con permisos para gestionar fotografías')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

COMMENT ON TABLE public.roles IS 'Define los roles disponibles en el sistema.';
COMMENT ON COLUMN public.roles.id IS 'Identificador único del rol (TEXT).';
COMMENT ON COLUMN public.roles.name IS 'Nombre del rol (ej. admin, asesor, photographer).';
COMMENT ON COLUMN public.roles.description IS 'Descripción del rol.';
