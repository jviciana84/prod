-- =====================================================
-- VERIFICAR Y ARREGLAR TRIGGER AUTOMÁTICO
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Verificar estado del trigger y recrearlo si es necesario
-- =====================================================

-- 1. Verificar estado actual del trigger
SELECT '=== ESTADO ACTUAL DEL TRIGGER ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    trigger_schema
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper'
AND trigger_name = 'trigger_auto_process_filters';

-- 2. Verificar función del trigger
SELECT '=== FUNCIÓN DEL TRIGGER ===' as info;
SELECT 
    routine_name,
    routine_type,
    routine_definition IS NOT NULL as tiene_definicion
FROM information_schema.routines 
WHERE routine_name = 'auto_process_filters_on_duc_update';

-- 3. Verificar función process_filter_configs
SELECT '=== FUNCIÓN PROCESS_FILTER_CONFIGS ===' as info;
SELECT 
    routine_name,
    routine_type,
    routine_definition IS NOT NULL as tiene_definicion
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- 4. Recrear función del trigger
CREATE OR REPLACE FUNCTION auto_process_filters_on_duc_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Log de activación del trigger
    INSERT INTO scraper_logs (level, message, timestamp) 
    VALUES ('info', '🔄 Trigger activado: procesando filtros automáticamente...', NOW());
    
    -- Procesar configuraciones activas con auto_process = true
    PERFORM process_filter_configs();
    
    -- Log de completado
    INSERT INTO scraper_logs (level, message, timestamp) 
    VALUES ('info', '✅ Trigger completado: procesamiento automático finalizado', NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recrear trigger
DROP TRIGGER IF EXISTS trigger_auto_process_filters ON duc_scraper;

CREATE TRIGGER trigger_auto_process_filters
    AFTER INSERT OR UPDATE ON duc_scraper
    FOR EACH ROW
    EXECUTE FUNCTION auto_process_filters_on_duc_update();

-- 6. Verificar que se recreó correctamente
SELECT '=== TRIGGER RECREADO ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'duc_scraper'
AND trigger_name = 'trigger_auto_process_filters';

-- 7. Probar el trigger con un registro de prueba
SELECT '=== PRUEBA DEL TRIGGER ===' as info;
INSERT INTO duc_scraper (
    "ID Anuncio",
    "Matrícula", 
    "Modelo",
    "Versión",
    "Fecha compra DMS",
    "Disponibilidad",
    "Marca",
    "Precio",
    "KM",
    "Combustible",
    "Concesionario",
    "Libre de siniestros",
    "Fecha fabricación",
    "Días stock",
    file_name
) VALUES (
    'TEST-TRIGGER-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'TEST' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'BMW X3',
    '2.0d xDrive',
    '01-01-2024',
    'Disponible',
    'BMW',
    '45000',
    '25000',
    'Diésel',
    'BMW Madrid',
    'Sí',
    '2022',
    '30',
    'test_trigger.csv'
);

-- 8. Verificar logs del trigger
SELECT '=== LOGS DEL TRIGGER ===' as info;
SELECT 
    level,
    message,
    timestamp
FROM scraper_logs 
WHERE message LIKE '%Trigger%'
ORDER BY timestamp DESC
LIMIT 10;

-- 9. Verificar si se procesó automáticamente
SELECT '=== VERIFICAR PROCESAMIENTO AUTOMÁTICO ===' as info;
SELECT 
    COUNT(*) as total_vehiculos_duc,
    (SELECT COUNT(*) FROM nuevas_entradas WHERE license_plate LIKE 'TEST%') as vehiculos_procesados
FROM duc_scraper 
WHERE "ID Anuncio" LIKE 'TEST-TRIGGER-%';

-- 10. Limpiar datos de prueba
DELETE FROM nuevas_entradas WHERE license_plate LIKE 'TEST%';
DELETE FROM duc_scraper WHERE "ID Anuncio" LIKE 'TEST-TRIGGER-%';

SELECT '=== LIMPIEZA COMPLETADA ===' as info; 