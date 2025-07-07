-- Función auxiliar para la ejecución manual (si es necesario)
-- Debe definirse primero si se va a llamar en el mismo script
CREATE OR REPLACE FUNCTION public.handle_profile_alias_mapping_manual(p_user_id UUID, p_full_name TEXT, p_alias TEXT)
RETURNS VOID AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;

    INSERT INTO public.user_asesor_mapping (user_id, profile_name, asesor_alias, email, active)
    VALUES (
        p_user_id,
        p_full_name,
        p_alias,
        COALESCE(user_email, 'Email no disponible'),
        TRUE
    )
    ON CONFLICT (user_id, asesor_alias) DO UPDATE SET
        profile_name = EXCLUDED.profile_name,
        email = EXCLUDED.email,
        active = TRUE,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para manejar la creación/actualización automática de mapeos de usuario
CREATE OR REPLACE FUNCTION public.handle_profile_alias_mapping()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Obtener el email del usuario desde auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

    IF NEW.alias IS NOT NULL AND NEW.alias != '' THEN
        -- Si el alias existe, insertar o actualizar el mapeo
        INSERT INTO public.user_asesor_mapping (user_id, profile_name, asesor_alias, email, active)
        VALUES (
            NEW.id,
            NEW.full_name,
            NEW.alias,
            COALESCE(user_email, 'Email no disponible'),
            TRUE
        )
        ON CONFLICT (user_id, asesor_alias) DO UPDATE SET
            profile_name = EXCLUDED.profile_name,
            email = EXCLUDED.email,
            active = TRUE,
            updated_at = NOW();
    ELSE
        -- Si el alias es NULL o vacío, desactivar cualquier mapeo existente para este user_id
        UPDATE public.user_asesor_mapping
        SET active = FALSE, updated_at = NOW()
        WHERE user_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución a la función del trigger
GRANT EXECUTE ON FUNCTION public.handle_profile_alias_mapping() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_profile_alias_mapping() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_profile_alias_mapping() TO authenticated; -- Si es necesario para RLS

-- Otorgar permisos de ejecución a la función manual (si se usa)
GRANT EXECUTE ON FUNCTION public.handle_profile_alias_mapping_manual(UUID, TEXT, TEXT) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_profile_alias_mapping_manual(UUID, TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_profile_alias_mapping_manual(UUID, TEXT, TEXT) TO authenticated;

-- Crear o reemplazar el trigger en la tabla profiles
DROP TRIGGER IF EXISTS on_profile_alias_changed ON public.profiles;
CREATE TRIGGER on_profile_alias_changed
AFTER INSERT OR UPDATE OF alias, full_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_alias_mapping();

-- Verificar que el trigger y la función se crearon correctamente
SELECT 'Trigger y función de mapeo automático creados/actualizados.' as status;

-- Opcional: Ejecutar la función manualmente para perfiles existentes que ya tienen alias
-- Esto mapeará los usuarios existentes que ya tienen un alias en su perfil
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    FOR profile_record IN SELECT id, full_name, alias FROM public.profiles WHERE alias IS NOT NULL AND alias != ''
    LOOP
        PERFORM public.handle_profile_alias_mapping_manual(profile_record.id, profile_record.full_name, profile_record.alias);
    END LOOP;
END $$;
