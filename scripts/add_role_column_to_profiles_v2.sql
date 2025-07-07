ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT;

COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario (ej. admin, asesor, photographer).';
