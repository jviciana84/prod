-- Script para añadir columnas de documentos a la tabla extornos
-- Este script es seguro para ejecutar múltiples veces

DO $$
BEGIN
    -- Añadir columna documentos_adjuntos si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extornos' AND column_name = 'documentos_adjuntos'
    ) THEN
        ALTER TABLE extornos ADD COLUMN documentos_adjuntos JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna documentos_adjuntos añadida';
    ELSE
        RAISE NOTICE 'Columna documentos_adjuntos ya existe';
    END IF;

    -- Añadir columna documentos_tramitacion si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extornos' AND column_name = 'documentos_tramitacion'
    ) THEN
        ALTER TABLE extornos ADD COLUMN documentos_tramitacion JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna documentos_tramitacion añadida';
    ELSE
        RAISE NOTICE 'Columna documentos_tramitacion ya existe';
    END IF;

    -- Añadir columna created_by si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extornos' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE extornos ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Columna created_by añadida';
    ELSE
        RAISE NOTICE 'Columna created_by ya existe';
    END IF;

    -- Añadir columna updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'extornos' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE extornos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at añadida';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe';
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_extornos_documentos_adjuntos ON extornos USING GIN (documentos_adjuntos);
CREATE INDEX IF NOT EXISTS idx_extornos_documentos_tramitacion ON extornos USING GIN (documentos_tramitacion);
CREATE INDEX IF NOT EXISTS idx_extornos_created_by ON extornos (created_by);
CREATE INDEX IF NOT EXISTS idx_extornos_updated_at ON extornos (updated_at);

-- Actualizar registros existentes que no tengan las columnas inicializadas
UPDATE extornos 
SET 
    documentos_adjuntos = '[]'::jsonb,
    documentos_tramitacion = '[]'::jsonb,
    updated_at = NOW()
WHERE 
    documentos_adjuntos IS NULL 
    OR documentos_tramitacion IS NULL 
    OR updated_at IS NULL;

-- Verificar que todo está correcto
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'extornos' 
    AND column_name IN ('documentos_adjuntos', 'documentos_tramitacion', 'created_by', 'updated_at');
    
    IF col_count = 4 THEN
        RAISE NOTICE '✅ Todas las columnas han sido creadas correctamente';
    ELSE
        RAISE NOTICE '❌ Faltan columnas. Solo se encontraron: %', col_count;
    END IF;
END $$;
