-- ===================================================================
-- SISTEMA DE CONFIRMACIÓN DE EXTORNOS - VERSIÓN FINAL CORREGIDA
-- Arregla el error de comparación text = uuid y parámetros de función
-- ===================================================================

-- 1. Primero verificar la estructura actual de la tabla extornos
DO $$
BEGIN
    -- Verificar si la columna confirmation_token existe y es del tipo correcto
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extornos' 
        AND column_name = 'confirmation_token'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna si no existe
        ALTER TABLE public.extornos ADD COLUMN confirmation_token UUID;
        RAISE NOTICE 'Columna confirmation_token agregada como UUID';
    END IF;
    
    -- Verificar si la columna pago_confirmado_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extornos' 
        AND column_name = 'pago_confirmado_at'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna si no existe
        ALTER TABLE public.extornos ADD COLUMN pago_confirmado_at TIMESTAMPTZ;
        RAISE NOTICE 'Columna pago_confirmado_at agregada';
    END IF;
END $$;

-- 2. Eliminar funciones existentes para evitar conflictos
DROP FUNCTION IF EXISTS public.confirm_extorno_payment(uuid);
DROP FUNCTION IF EXISTS public.confirm_extorno_payment(text);
DROP FUNCTION IF EXISTS public.generate_confirmation_token(integer);

-- 3. Crear la función de confirmación de pago con manejo correcto de tipos
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
    -- Buscar el extorno usando el UUID convertido directamente en la cláusula WHERE
    SELECT * INTO extorno_record
    FROM public.extornos 
    WHERE confirmation_token = token_to_confirm::uuid -- Casteo explícito aquí
    AND estado = 'tramitado'
    AND (pago_confirmado_at IS NULL OR pago_confirmado_at < NOW() - INTERVAL '1 hour');
    
    -- Si no se encuentra el extorno
    IF NOT FOUND THEN
        -- Verificar si existe pero ya fue confirmado
        IF EXISTS (
            SELECT 1 FROM public.extornos 
            WHERE confirmation_token = token_to_confirm::uuid -- Casteo explícito aquí
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

-- 4. Función para generar tokens de confirmación (con nombre de parámetro correcto)
CREATE OR REPLACE FUNCTION public.generate_confirmation_token(extorno_id_param INTEGER)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
   new_token UUID;
   extorno_exists boolean;
BEGIN
   -- Verificar que el extorno existe
   SELECT EXISTS(SELECT 1 FROM public.extornos WHERE id = extorno_id_param) INTO extorno_exists;
   
   IF NOT extorno_exists THEN
       RAISE EXCEPTION 'Extorno no encontrado con ID: %', extorno_id_param;
   END IF;
   
   -- Generar un nuevo token UUID
   new_token := gen_random_uuid();
   
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

-- 5. Dar permisos a las funciones
GRANT EXECUTE ON FUNCTION public.confirm_extorno_payment(text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_extorno_payment(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_confirmation_token(INTEGER) TO authenticated;

-- 6. Crear índice para mejorar performance en búsquedas por token
CREATE INDEX IF NOT EXISTS idx_extornos_confirmation_token 
ON public.extornos(confirmation_token) 
WHERE confirmation_token IS NOT NULL;

-- 7. Verificación final
DO $$
DECLARE
    func_count integer;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc 
    WHERE proname = 'confirm_extorno_payment';
    
    IF func_count > 0 THEN
        RAISE NOTICE '✅ Función confirm_extorno_payment creada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Función confirm_extorno_payment no se creó';
    END IF;
END $$;

-- 8. Test de la función con token inválido
DO $$
DECLARE
    result record;
BEGIN
    SELECT * INTO result FROM public.confirm_extorno_payment('invalid-token-format');
    RAISE NOTICE 'Test con token inválido: success=%, message=%', result.success, result.message;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error en test: %', SQLERRM;
END $$;
