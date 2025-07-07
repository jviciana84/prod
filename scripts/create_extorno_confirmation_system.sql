-- ===================================================================
-- SISTEMA DE CONFIRMACIÓN DE EXTORNOS - VERSIÓN CORREGIDA
-- Estado final: "realizado" (no "pagado")
-- ===================================================================

-- 1. Eliminar cualquier función duplicada
DROP FUNCTION IF EXISTS public.confirm_extorno_payment(uuid);
DROP FUNCTION IF EXISTS public.confirm_extorno_payment(text);

-- 2. Crear la función de confirmación de pago
CREATE OR REPLACE FUNCTION public.confirm_extorno_payment(token_to_confirm text)
RETURNS TABLE(
    success boolean,
    message text,
    matricula text,
    cliente text,
    importe numeric,
    extorno_id bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    extorno_record record;
BEGIN
    -- Buscar el extorno por token
    SELECT * INTO extorno_record
    FROM public.extornos 
    WHERE confirmation_token = token_to_confirm::uuid
    AND estado = 'tramitado'
    AND pago_confirmado_at IS NULL;
    
    -- Si no se encuentra el extorno
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false as success,
            'Token no válido o extorno ya confirmado' as message,
            ''::text as matricula,
            ''::text as cliente,
            0::numeric as importe,
            0::bigint as extorno_id;
        RETURN;
    END IF;
    
    -- Actualizar el extorno a estado "realizado"
    UPDATE public.extornos 
    SET 
        estado = 'realizado'::extorno_estado,
        pago_confirmado_at = NOW(),
        confirmation_token = NULL  -- Limpiar el token después de usarlo
    WHERE id = extorno_record.id;
    
    -- Retornar éxito con datos del extorno
    RETURN QUERY SELECT 
        true as success,
        'Pago confirmado exitosamente' as message,
        extorno_record.matricula as matricula,
        extorno_record.cliente as cliente,
        extorno_record.importe as importe,
        extorno_record.id as extorno_id;
END;
$$;

-- 3. Dar permisos públicos a la función
GRANT EXECUTE ON FUNCTION public.confirm_extorno_payment(text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_extorno_payment(text) TO authenticated;

-- 4. Función para generar tokens de confirmación (si no existe)
CREATE OR REPLACE FUNCTION public.generate_confirmation_token(extorno_id INTEGER)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
   new_token UUID;
BEGIN
   -- Generar un nuevo token UUID
   new_token := gen_random_uuid();
   
   -- Actualizar el extorno con el nuevo token
   UPDATE public.extornos 
   SET confirmation_token = new_token
   WHERE id = extorno_id;
   
   -- Verificar que se actualizó
   IF NOT FOUND THEN
       RAISE EXCEPTION 'Extorno no encontrado con ID: %', extorno_id;
   END IF;
   
   RETURN new_token;
END;
$$;

-- 5. Dar permisos a la función de generación de tokens
GRANT EXECUTE ON FUNCTION public.generate_confirmation_token(INTEGER) TO authenticated;

-- 6. Verificar que todo está correcto
SELECT 
    'Función creada correctamente' as status,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'confirm_extorno_payment';

-- 7. Verificar estados disponibles en el ENUM
SELECT 
    'Estados disponibles:' as info,
    string_agg(enumlabel, ', ' ORDER BY enumlabel) as estados
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'extorno_estado');
