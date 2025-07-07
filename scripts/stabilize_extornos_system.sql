-- Script para estabilizar la tabla `extornos` y su sistema de notificaciones.
-- Es seguro ejecutar este script múltiples veces.

DO $$
BEGIN
    RAISE NOTICE '--- Iniciando estabilización de la tabla extornos ---';

    -- 1. Asegurar que el tipo "extorno_estado" existe con todos los valores necesarios
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'extorno_estado') THEN
        CREATE TYPE public.extorno_estado AS ENUM ('pendiente', 'tramitacion', 'realizado', 'rechazado');
        RAISE NOTICE 'Tipo "extorno_estado" creado.';
    ELSE
        -- Añadir valores si no existen (esto es más complejo en PostgreSQL, pero intentamos una aproximación)
        -- Esta sintaxis es para PostgreSQL v10+
        BEGIN
            ALTER TYPE public.extorno_estado ADD VALUE IF NOT EXISTS 'pendiente';
            ALTER TYPE public.extorno_estado ADD VALUE IF NOT EXISTS 'tramitacion';
            ALTER TYPE public.extorno_estado ADD VALUE IF NOT EXISTS 'realizado';
            ALTER TYPE public.extorno_estado ADD VALUE IF NOT EXISTS 'rechazado';
            RAISE NOTICE 'Valores asegurados en el tipo "extorno_estado".';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Los valores del tipo "extorno_estado" ya existen.';
        END;
    END IF;

    -- 2. Añadir columnas a la tabla `extornos` si no existen
    ALTER TABLE public.extornos ADD COLUMN IF NOT EXISTS estado public.extorno_estado DEFAULT 'pendiente';
    ALTER TABLE public.extornos ADD COLUMN IF NOT EXISTS confirmation_token UUID;
    ALTER TABLE public.extornos ADD COLUMN IF NOT EXISTS pago_confirmado_at TIMESTAMPTZ;
    ALTER TABLE public.extornos ADD COLUMN IF NOT EXISTS pago_confirmado_por UUID REFERENCES auth.users(id);
    ALTER TABLE public.extornos ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
    ALTER TABLE public.extornos ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
    ALTER TABLE public.extornos ADD COLUMN IF NOT EXISTS documentos_adjuntos JSONB;
    ALTER TABLE public.extornos ADD COLUMN IF NOT EXISTS documentos_tramitacion JSONB;
    ALTER TABLE public.extornos ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

    RAISE NOTICE 'Columnas de la tabla `extornos` aseguradas.';

    -- 3. Limpiar estados inconsistentes
    -- Si un extorno está 'realizado' pero aún tiene un token, se lo quitamos.
    UPDATE public.extornos
    SET confirmation_token = NULL
    WHERE estado = 'realizado' AND confirmation_token IS NOT NULL;
    RAISE NOTICE 'Tokens de extornos ya realizados han sido limpiados.';

    -- 4. Estabilizar la tabla de configuración de emails
    CREATE TABLE IF NOT EXISTS public.extornos_email_config (
        id INT PRIMARY KEY DEFAULT 1,
        enabled BOOLEAN DEFAULT TRUE,
        email_tramitador TEXT,
        email_pagador TEXT,
        cc_emails TEXT[],
        CONSTRAINT single_row_check CHECK (id = 1)
    );
    RAISE NOTICE 'Tabla `extornos_email_config` asegurada.';

    -- Insertar una fila de configuración por defecto si no existe
    INSERT INTO public.extornos_email_config (id, enabled, email_tramitador, email_pagador, cc_emails)
    VALUES (1, TRUE, NULL, NULL, NULL)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Fila de configuración por defecto en `extornos_email_config` asegurada.';

    RAISE NOTICE '--- Estabilización completada ---';
END;
$$;
