-- =====================================================
-- TRIGGER AUTOMÁTICO PARA PERMISOS DE CIRCULACIÓN
-- =====================================================
-- Este trigger mantiene la lógica actual pero la automatiza:
-- Solo genera solicitudes cuando se registra fecha_entrega en entregas

-- 1. Crear función para manejar la generación automática
CREATE OR REPLACE FUNCTION generar_permiso_circulacion_automatico()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar cuando se establece fecha_entrega (no cuando es NULL)
    IF NEW.fecha_entrega IS NOT NULL AND (OLD.fecha_entrega IS NULL OR OLD.fecha_entrega != NEW.fecha_entrega) THEN
        
        RAISE NOTICE '🔄 Generando solicitud de permiso de circulación para entrega % (matrícula: %)', NEW.id, NEW.matricula;
        
        -- Verificar que no existe ya una solicitud para esta entrega
        IF NOT EXISTS (
            SELECT 1 FROM circulation_permit_requests 
            WHERE entrega_id = NEW.id
        ) THEN
            
            -- Crear la solicitud de permiso de circulación
            INSERT INTO circulation_permit_requests (
                entrega_id,
                license_plate,
                model,
                asesor_alias,
                request_date,
                status,
                observations
            ) VALUES (
                NEW.id,
                NEW.matricula,
                NEW.modelo,
                NEW.asesor,
                NEW.fecha_entrega,
                'pending',
                'Generado automáticamente al registrar fecha de entrega'
            );
            
            -- Obtener el ID de la solicitud creada
            DECLARE
                solicitud_id UUID;
            BEGIN
                SELECT id INTO solicitud_id 
                FROM circulation_permit_requests 
                WHERE entrega_id = NEW.id;
                
                -- Crear el material de permiso de circulación
                INSERT INTO circulation_permit_materials (
                    circulation_permit_request_id,
                    material_type,
                    material_label,
                    selected,
                    observations
                ) VALUES (
                    solicitud_id,
                    'circulation_permit',
                    'Permiso de Circulación',
                    false,
                    ''
                );
                
                RAISE NOTICE '✅ Solicitud de permiso creada automáticamente (ID: %)', solicitud_id;
            END;
            
        ELSE
            RAISE NOTICE 'ℹ️ Ya existe una solicitud de permiso para la entrega %', NEW.id;
        END IF;
        
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error generando solicitud automática: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear el trigger en la tabla entregas
DROP TRIGGER IF EXISTS trigger_generar_permiso_circulacion ON entregas;
CREATE TRIGGER trigger_generar_permiso_circulacion
    AFTER INSERT OR UPDATE ON entregas
    FOR EACH ROW
    EXECUTE FUNCTION generar_permiso_circulacion_automatico();

-- 3. Verificar que el trigger se creó correctamente
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'entregas' 
  AND trigger_name = 'trigger_generar_permiso_circulacion';

-- 4. Comentarios para documentar
COMMENT ON FUNCTION generar_permiso_circulacion_automatico() IS 'Función que genera automáticamente solicitudes de permiso de circulación cuando se registra fecha_entrega en entregas';
COMMENT ON TRIGGER trigger_generar_permiso_circulacion ON entregas IS 'Trigger que activa la generación automática de solicitudes de permiso de circulación';

-- 5. Mensaje de confirmación
SELECT '✅ TRIGGER AUTOMÁTICO CREADO EXITOSAMENTE' as status;
SELECT '📋 Lógica: Se genera solicitud automáticamente al registrar fecha_entrega' as descripcion; 