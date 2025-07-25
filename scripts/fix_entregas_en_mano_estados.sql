-- Script para verificar y corregir los estados de entregas_en_mano
-- ================================================================

-- 1. Verificar la estructura actual de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'entregas_en_mano'
ORDER BY ordinal_position;

-- 2. Verificar los estados actuales en la tabla
SELECT 
    estado,
    COUNT(*) as cantidad
FROM entregas_en_mano 
GROUP BY estado;

-- 3. Verificar si hay constraint de estados
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%entregas_en_mano%';

-- 4. Corregir la estructura si es necesario
DO $$
BEGIN
    -- Verificar si existe la columna estado con el constraint correcto
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'estado'
    ) THEN
        
        -- Eliminar constraint existente si existe
        ALTER TABLE entregas_en_mano DROP CONSTRAINT IF EXISTS entregas_en_mano_estado_check;
        
        -- Añadir el constraint correcto
        ALTER TABLE entregas_en_mano ADD CONSTRAINT entregas_en_mano_estado_check 
        CHECK (estado IN ('enviado', 'confirmado'));
        
        RAISE NOTICE '✅ Constraint de estado corregido';
        
    ELSE
        RAISE NOTICE '❌ Columna estado no encontrada';
    END IF;
    
    -- Verificar si existen columnas faltantes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'email_enviado'
    ) THEN
        ALTER TABLE entregas_en_mano ADD COLUMN email_enviado BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Columna email_enviado añadida';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'email_enviado_at'
    ) THEN
        ALTER TABLE entregas_en_mano ADD COLUMN email_enviado_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Columna email_enviado_at añadida';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'message_id'
    ) THEN
        ALTER TABLE entregas_en_mano ADD COLUMN message_id VARCHAR(255);
        RAISE NOTICE '✅ Columna message_id añadida';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'entregas_en_mano' 
        AND column_name = 'fecha_envio'
    ) THEN
        ALTER TABLE entregas_en_mano ADD COLUMN fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Columna fecha_envio añadida';
    END IF;
    
END $$;

-- 5. Verificar el resultado final
SELECT 
    'Estructura final de la tabla:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'entregas_en_mano'
ORDER BY ordinal_position;

-- 6. Verificar constraint final
SELECT 
    'Constraint de estado:' as info;
    
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%entregas_en_mano%';

-- 7. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_matricula ON entregas_en_mano(matricula);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_token ON entregas_en_mano(token_confirmacion);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_estado ON entregas_en_mano(estado);
CREATE INDEX IF NOT EXISTS idx_entregas_en_mano_fecha_envio ON entregas_en_mano(fecha_envio);

-- 8. Verificar que el trigger existe
SELECT 
    'Triggers existentes:' as info;
    
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'entregas_en_mano';

-- 9. Crear trigger si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE event_object_table = 'entregas_en_mano' 
        AND trigger_name = 'trigger_update_entregas_en_mano_updated_at'
    ) THEN
        
        -- Crear función si no existe
        CREATE OR REPLACE FUNCTION update_entregas_en_mano_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Crear trigger
        CREATE TRIGGER trigger_update_entregas_en_mano_updated_at
            BEFORE UPDATE ON entregas_en_mano
            FOR EACH ROW
            EXECUTE FUNCTION update_entregas_en_mano_updated_at();
            
        RAISE NOTICE '✅ Trigger creado';
    ELSE
        RAISE NOTICE '✅ Trigger ya existe';
    END IF;
END $$;

-- 10. Resumen final
SELECT 
    'RESUMEN DE CORRECCIONES:' as info;
    
SELECT 
    'Tabla entregas_en_mano lista para usar con estados: enviado, confirmado' as status; 