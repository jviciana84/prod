-- =====================================================
-- IMPLEMENTACIÓN COMPLETA DE LÓGICA ACTUAL AUTOMÁTICA
-- =====================================================
-- Este script implementa todo el sistema automático de permisos de circulación

-- =====================================================
-- PASO 1: VERIFICACIÓN DE TABLAS
-- =====================================================

SELECT '🔍 PASO 1: VERIFICANDO TABLAS NECESARIAS...' as info;

-- Verificar tabla entregas
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entregas') 
        THEN '✅ Tabla entregas existe'
        ELSE '❌ Tabla entregas NO existe'
    END as status_entregas;

-- Verificar tabla circulation_permit_requests
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'circulation_permit_requests') 
        THEN '✅ Tabla circulation_permit_requests existe'
        ELSE '❌ Tabla circulation_permit_requests NO existe'
    END as status_circulation_requests;

-- Verificar tabla circulation_permit_materials
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'circulation_permit_materials') 
        THEN '✅ Tabla circulation_permit_materials existe'
        ELSE '❌ Tabla circulation_permit_materials NO existe'
    END as status_circulation_materials;

-- =====================================================
-- PASO 2: CREAR FUNCIÓN AUTOMÁTICA
-- =====================================================

SELECT '🔧 PASO 2: CREANDO FUNCIÓN AUTOMÁTICA...' as info;

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

-- =====================================================
-- PASO 3: CREAR TRIGGER
-- =====================================================

SELECT '⚡ PASO 3: CREANDO TRIGGER...' as info;

DROP TRIGGER IF EXISTS trigger_generar_permiso_circulacion ON entregas;
CREATE TRIGGER trigger_generar_permiso_circulacion
    AFTER INSERT OR UPDATE ON entregas
    FOR EACH ROW
    EXECUTE FUNCTION generar_permiso_circulacion_automatico();

-- =====================================================
-- PASO 4: MIGRAR DATOS EXISTENTES
-- =====================================================

SELECT '📦 PASO 4: MIGRANDO DATOS EXISTENTES...' as info;

-- Verificar entregas que necesitan migración
SELECT 
    'ENTREGAS CON FECHA_ENTREGA SIN SOLICITUD' as info,
    COUNT(*) as total
FROM entregas e
LEFT JOIN circulation_permit_requests cpr ON e.id = cpr.entrega_id
WHERE e.fecha_entrega IS NOT NULL 
  AND e.asesor IS NOT NULL 
  AND e.asesor != ''
  AND cpr.id IS NULL;

-- Migrar entregas existentes (solo las que no tienen solicitud)
INSERT INTO circulation_permit_requests (
    entrega_id,
    license_plate,
    model,
    asesor_alias,
    request_date,
    status,
    observations
)
SELECT 
    e.id,
    e.matricula,
    e.modelo,
    e.asesor,
    e.fecha_entrega,
    'pending',
    'Migrado automáticamente desde entrega existente'
FROM entregas e
LEFT JOIN circulation_permit_requests cpr ON e.id = cpr.entrega_id
WHERE e.fecha_entrega IS NOT NULL 
  AND e.asesor IS NOT NULL 
  AND e.asesor != ''
  AND cpr.id IS NULL
ON CONFLICT (entrega_id) DO NOTHING;

-- Crear materiales para las solicitudes migradas
INSERT INTO circulation_permit_materials (
    circulation_permit_request_id,
    material_type,
    material_label,
    selected,
    observations
)
SELECT 
    cpr.id,
    'circulation_permit',
    'Permiso de Circulación',
    false,
    ''
FROM circulation_permit_requests cpr
LEFT JOIN circulation_permit_materials cpm ON cpr.id = cpm.circulation_permit_request_id
WHERE cpr.observations = 'Migrado automáticamente desde entrega existente'
  AND cpm.id IS NULL;

-- =====================================================
-- PASO 5: VERIFICACIÓN FINAL
-- =====================================================

SELECT '✅ PASO 5: VERIFICACIÓN FINAL...' as info;

-- Verificar trigger activo
SELECT 
    'TRIGGER ACTIVO:' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'entregas' 
  AND trigger_name = 'trigger_generar_permiso_circulacion';

-- Verificar solicitudes generadas
SELECT 
    'SOLICITUDES GENERADAS:' as info,
    COUNT(*) as total_solicitudes,
    COUNT(CASE WHEN observations LIKE '%automáticamente%' THEN 1 END) as generadas_automaticamente,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completadas
FROM circulation_permit_requests;

-- Verificar materiales creados
SELECT 
    'MATERIALES CREADOS:' as info,
    COUNT(*) as total_materiales,
    COUNT(CASE WHEN selected = false THEN 1 END) as no_seleccionados,
    COUNT(CASE WHEN selected = true THEN 1 END) as seleccionados
FROM circulation_permit_materials;

-- Verificar que no quedan entregas sin migrar
SELECT 
    'ENTREGAS PENDIENTES:' as info,
    COUNT(*) as total
FROM entregas e
LEFT JOIN circulation_permit_requests cpr ON e.id = cpr.entrega_id
WHERE e.fecha_entrega IS NOT NULL 
  AND e.asesor IS NOT NULL 
  AND e.asesor != ''
  AND cpr.id IS NULL;

-- =====================================================
-- PASO 6: DOCUMENTACIÓN
-- =====================================================

SELECT '📋 PASO 6: DOCUMENTANDO...' as info;

-- Comentarios para documentar
COMMENT ON FUNCTION generar_permiso_circulacion_automatico() IS 'Función que genera automáticamente solicitudes de permiso de circulación cuando se registra fecha_entrega en entregas';
COMMENT ON TRIGGER trigger_generar_permiso_circulacion ON entregas IS 'Trigger que activa la generación automática de solicitudes de permiso de circulación';

-- =====================================================
-- RESULTADO FINAL
-- =====================================================

SELECT '🎉 IMPLEMENTACIÓN COMPLETADA EXITOSAMENTE' as resultado;
SELECT '📋 Lógica: Se genera solicitud automáticamente al registrar fecha_entrega' as descripcion;
SELECT '🔄 Próximo paso: Probar el sistema en la interfaz web' as siguiente_paso; 