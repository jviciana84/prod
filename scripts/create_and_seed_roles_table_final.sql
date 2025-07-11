-- Crear la tabla roles si no existe, con id de tipo INTEGER y autoincremental
CREATE TABLE IF NOT EXISTS public.roles (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar roles si no existen o actualizar sus nombres/descripciones
-- Los IDs se generarán automáticamente si no se especifican, o se usarán los existentes si hay conflicto por 'name'
INSERT INTO public.roles (name, description)
VALUES
    ('admin', 'Usuario con permisos de administrador total'),
    ('asesor', 'Usuario con permisos de asesor de ventas'),
    ('Supervisor', 'Supervisión de operaciones y reportes'),
    ('Logística', 'Gestión de logística y transporte de vehículos'),
    ('Asesor ventas', 'Gestión de ventas y atención al cliente'),
    ('Mecánica', 'Revisión y reparación mecánica de vehículos'),
    ('Carrocería', 'Trabajos de carrocería y pintura')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

COMMENT ON TABLE public.roles IS 'Define los roles disponibles en el sistema.';
COMMENT ON COLUMN public.roles.id IS 'Identificador único del rol (INTEGER, autoincremental).';
COMMENT ON COLUMN public.roles.name IS 'Nombre del rol (ej. admin, asesor).';
COMMENT ON COLUMN public.roles.description IS 'Descripción del rol.';
