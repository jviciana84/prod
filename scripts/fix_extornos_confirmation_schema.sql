-- Este script asegura que la tabla 'extornos' tenga el esquema correcto para el flujo de confirmación de pago.
-- Es seguro ejecutarlo varias veces.

BEGIN;

-- 1. Asegurar que la columna 'estado' exista y tenga el tipo correcto.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='extornos' AND column_name='estado') THEN
        ALTER TABLE public.extornos ADD COLUMN estado TEXT DEFAULT 'pendiente';
        RAISE NOTICE 'Columna "estado" añadida a la tabla "extornos".';
    ELSE
        ALTER TABLE public.extornos ALTER COLUMN estado SET DEFAULT 'pendiente';
        RAISE NOTICE 'Columna "estado" ya existe.';
    END IF;
END $$;

-- 2. Asegurar que la columna 'pago_confirmado_at' exista.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='extornos' AND column_name='pago_confirmado_at') THEN
        ALTER TABLE public.extornos ADD COLUMN pago_confirmado_at TIMESTAMPTZ;
        RAISE NOTICE 'Columna "pago_confirmado_at" añadida a la tabla "extornos".';
    ELSE
        RAISE NOTICE 'Columna "pago_confirmado_at" ya existe.';
    END IF;
END $$;

-- 3. Asegurar que la columna 'pago_confirmado_por' exista y tenga clave foránea.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='extornos' AND column_name='pago_confirmado_por') THEN
        ALTER TABLE public.extornos ADD COLUMN pago_confirmado_por UUID;
        RAISE NOTICE 'Columna "pago_confirmado_por" añadida.';
    ELSE
        RAISE NOTICE 'Columna "pago_confirmado_por" ya existe.';
    END IF;

    -- Añadir la clave foránea si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'extornos_pago_confirmado_por_fkey' AND conrelid = 'public.extornos'::regclass
    ) THEN
        ALTER TABLE public.extornos
        ADD CONSTRAINT extornos_pago_confirmado_por_fkey
        FOREIGN KEY (pago_confirmado_por) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Foreign key en "pago_confirmado_por" añadida.';
    ELSE
        RAISE NOTICE 'Foreign key en "pago_confirmado_por" ya existe.';
    END IF;
END $$;

-- 4. Asegurar que la columna 'confirmation_token' exista.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='extornos' AND column_name='confirmation_token') THEN
        ALTER TABLE public.extornos ADD COLUMN confirmation_token TEXT;
        RAISE NOTICE 'Columna "confirmation_token" añadida a la tabla "extornos".';
    ELSE
        RAISE NOTICE 'Columna "confirmation_token" ya existe.';
    END IF;
END $$;

-- 5. Asegurar que la columna 'created_by' exista y tenga clave foránea.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='extornos' AND column_name='created_by') THEN
        ALTER TABLE public.extornos ADD COLUMN created_by UUID;
        RAISE NOTICE 'Columna "created_by" añadida.';
    ELSE
        RAISE NOTICE 'Columna "created_by" ya existe.';
    END IF;

    -- Añadir la clave foránea si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'extornos_created_by_fkey' AND conrelid = 'public.extornos'::regclass
    ) THEN
        ALTER TABLE public.extornos
        ADD CONSTRAINT extornos_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Foreign key en "created_by" añadida.';
    ELSE
        RAISE NOTICE 'Foreign key en "created_by" ya existe.';
    END IF;
END $$;

-- 6. Actualizar el 'estado' para pagos ya confirmados si no están como 'realizado'
DO $$
BEGIN
    UPDATE public.extornos
    SET estado = 'realizado'
    WHERE pago_confirmado_at IS NOT NULL AND estado != 'realizado';
    
    RAISE NOTICE 'Estados de extornos confirmados actualizados a "realizado".';
END $$;

COMMIT;
