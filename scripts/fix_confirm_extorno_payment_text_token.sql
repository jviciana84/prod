-- ===================================================================
-- SISTEMA DE CONFIRMACIÓN DE EXTORNOS - VERSIÓN FINAL CORREGIDA
-- Arregla el error de comparación text = uuid (la columna es TEXT)
-- ===================================================================

-- 1. Eliminar funciones existentes para evitar conflictos
-- Es crucial eliminar la función con la firma correcta (text) si ya existe
DROP FUNCTION IF EXISTS public.confirm_extorno_payment(text);
DROP FUNCTION IF EXISTS public.generate_confirmation_token(integer);

-- 2. Crear la función de confirmación de pago con manejo correcto de tipos (TEXT)
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
    -- Buscar el extorno usando el token directamente (sin casteo a UUID)
    SELECT * INTO extorno_record
    FROM public.extornos 
    WHERE confirmation_token = token_to_confirm -- Comparación TEXT = TEXT
    AND estado = 'tramitado'
    AND (pago_confirmado_at IS NULL OR pago_confirmado_at < NOW() - INTERVAL '1 hour');
    
    -- Si no se encuentra el extorno
    IF NOT FOUND THEN
        -- Verificar si existe pero ya fue confirmado
        IF EXISTS (
            SELECT 1 FROM public.extornos 
            WHERE confirmation_token = token_to_confirm -- Comparación TEXT = TEXT
            AND pago_confirmado_at IS NOT NULL
        ) THEN
            RETURN QUERY SELECT 
                false as success,
                'Este extorno ya ha sido confirmado anteriormente' as message,
                ''::text as matricula,
                ''::text as cliente,
                0::numeric as importe,
                0::bigint as extorno_id;
        ELSE
            RETURN QUERY SELECT 
                false as success,
                'Token no válido o extorno no encontrado' as message,
                ''::text as matricula,
                ''::text as cliente,
                0::numeric as importe,
                0::bigint as extorno_id;
        END IF;
        RETURN;
    END IF;
    
    -- Actualizar el extorno a estado "realizado"
    UPDATE public.extornos 
    SET 
        estado = 'realizado'::extorno_estado,
        pago_confirmado_at = NOW(),
        confirmation_token = NULL  -- Limpiar el token después de usarlo
    WHERE id = extorno_record.id;
    
    -- Verificar que la actualización fue exitosa
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false as success,
            'Error al actualizar el extorno' as message,
            ''::text as matricula,
            ''::text as cliente,
            0::numeric as importe,
            0::bigint as extorno_id;
        RETURN;
    END IF;
    
    -- Retornar éxito con datos del extorno
    RETURN QUERY SELECT 
        true as success,
        'Pago confirmado exitosamente' as message,
        COALESCE(extorno_record.matricula, '') as matricula,
        COALESCE(extorno_record.cliente, '') as cliente,
        COALESCE(extorno_record.importe, 0) as importe,
        extorno_record.id as extorno_id;
END;
$$;

-- 3. Función para generar tokens de confirmación (sin cambios, ya que el parámetro es INTEGER)
CREATE OR REPLACE FUNCTION public.generate_confirmation_token(extorno_id_param INTEGER)
RETURNS TEXT -- Retorna TEXT, no UUID, para que coincida con la columna
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
   new_token TEXT; -- Cambiado a TEXT
   extorno_exists boolean;
BEGIN
   -- Verificar que el extorno existe
   SELECT EXISTS(SELECT 1 FROM public.extornos WHERE id = extorno_id_param) INTO extorno_exists;
   
   IF NOT extorno_exists THEN
       RAISE EXCEPTION 'Extorno no encontrado con ID: %', extorno_id_param;
   END IF;
   
   -- Generar un nuevo token UUID y convertirlo a TEXT
   new_token := gen_random_uuid()::text; -- Casteo a TEXT aquí
   
   -- Actualizar el extorno con el nuevo token
   UPDATE public.extornos 
   SET confirmation_token = new_token
   WHERE id = extorno_id_param;
   
   -- Verificar que se actualizó
   IF NOT FOUND THEN
       RAISE EXCEPTION 'Error al actualizar el token para extorno ID: %', extorno_id_param;
   END IF;
   
   RETURN new_token;
END;
$$;

-- 4. Dar permisos a las funciones
GRANT EXECUTE ON FUNCTION public.confirm_extorno_payment(text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_extorno_payment(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_confirmation_token(INTEGER) TO authenticated;

-- 5. Crear índice para mejorar performance en búsquedas por token
CREATE INDEX IF NOT EXISTS idx_extornos_confirmation_token 
ON public.extornos(confirmation_token) 
WHERE confirmation_token IS NOT NULL;

-- 6. Verificación final (opcional, para depuración)
DO $$
DECLARE
    func_count integer;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc 
    WHERE proname = 'confirm_extorno_payment' AND proargtypes::regtype[] @> ARRAY['text'::regtype];
    
    IF func_count > 0 THEN
        RAISE NOTICE '✅ Función confirm_extorno_payment(text) creada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Función confirm_extorno_payment(text) no se creó';
    END IF;

    SELECT COUNT(*) INTO func_count
    FROM pg_proc 
    WHERE proname = 'generate_confirmation_token' AND proargtypes::regtype[] @> ARRAY['integer'::regtype];
    
    IF func_count > 0 THEN
        RAISE NOTICE '✅ Función generate_confirmation_token(integer) creada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Función generate_confirmation_token(integer) no se creó';
    END IF;
END $$;
