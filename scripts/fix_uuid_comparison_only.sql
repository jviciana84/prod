-- Arreglar solo el problema de UUID sin tocar nada más
-- Eliminar la función actual y recrearla con el cast correcto

DROP FUNCTION IF EXISTS public.confirm_extorno_payment(text);
DROP FUNCTION IF EXISTS public.confirm_extorno_payment(uuid);

-- Crear la función con el cast explícito para UUID
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
    -- Buscar el extorno usando cast explícito de text a uuid
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
        confirmation_token = NULL
    WHERE id = extorno_record.id;
    
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

-- Dar permisos
GRANT EXECUTE ON FUNCTION public.confirm_extorno_payment(text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_extorno_payment(text) TO authenticated;
