-- Asignar el rol 'admin' a Jordi Viciana Sánchez
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'jordi.viciana@munichgroup.es';

-- Asignar el rol 'admin' a Sara Campoy (ejemplo de un admin de tu CSV)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'sara.campoy@munichgroup.es';

-- Puedes añadir más actualizaciones para otros administradores si es necesario
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'otro.admin@munichgroup.es';

-- Opcional: Si quieres asegurarte de que todos los demás sean 'asesor' explícitamente
-- UPDATE public.profiles
-- SET role = 'asesor'
-- WHERE role IS NULL OR role NOT IN ('admin', 'administrador'); -- Ajusta según tus roles
