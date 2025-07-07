UPDATE public.profiles AS p
SET role = (
    SELECT STRING_AGG(r.name, ', ' ORDER BY r.name)
    FROM public.user_roles AS ur
    JOIN public.roles AS r ON ur.role_id = r.id
    WHERE p.id = ur.user_id
)
WHERE EXISTS (
    SELECT 1
    FROM public.user_roles AS ur
    WHERE p.id = ur.user_id
);

-- Opcional: Si quieres asignar un rol por defecto a los usuarios que no tienen ningún rol asignado en user_roles
-- UPDATE public.profiles
-- SET role = 'usuario_estandar' -- Reemplaza con el rol por defecto que desees
-- WHERE role IS NULL;
