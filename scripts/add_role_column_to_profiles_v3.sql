ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT;

COMMENT ON COLUMN public.profiles.role IS 'Rol(es) principal(es) del usuario, denormalizado de user_roles para acceso rápido.';
