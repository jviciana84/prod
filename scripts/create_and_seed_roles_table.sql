-- Crear la tabla roles si no existe
CREATE TABLE IF NOT EXISTS public.roles (
    id INT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar roles si no existen
INSERT INTO public.roles (id, name)
VALUES
    (1, 'admin'),
    (7, 'asesor') -- Asumiendo que role_id 7 es 'asesor' por tu CSV
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

COMMENT ON TABLE public.roles IS 'Define los roles disponibles en el sistema.';
COMMENT ON COLUMN public.roles.id IS 'Identificador único del rol.';
COMMENT ON COLUMN public.roles.name IS 'Nombre del rol (ej. admin, asesor).';
