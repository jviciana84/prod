UPDATE public.profiles AS p
SET role = r.name
FROM public.user_roles AS ur
JOIN public.roles AS r ON ur.role_id::TEXT = r.id -- Se añade ::TEXT para asegurar la compatibilidad de tipos
WHERE p.id = ur.user_id;

-- Opcional: Si hay usuarios en 'profiles' que no tienen un rol en 'user_roles',
-- puedes asignarles un rol por defecto (ej. 'asesor' si es el predeterminado para nuevos usuarios)
-- UPDATE public.profiles
-- SET role = 'asesor'
-- WHERE role IS NULL;
