-- =====================================================
-- DIAGNÓSTICO DEL TRIGGER AUTOMÁTICO
-- =====================================================
-- Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Descripción: Diagnosticar por qué el trigger no se activa automáticamente
-- =====================================================

-- 1. Verificar si el trigger existe
SELECT '=== VERIFICAR TRIGGER ===' as info;
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
SELECT '=== VERIFICAR FUNCIÓN DEL TRIGGER ===' as info;
SELECT 
    routine_name,
    routine_type,
    routine_definition IS NOT NULL as tiene_definicion,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'auto_process_filters_on_duc_update';

-- 3. Verificar función process_filter_configs
SELECT '=== VERIFICAR FUNCIÓN PROCESS_FILTER_CONFIGS ===' as info;
SELECT 
    routine_name,
    routine_type,
    routine_definition IS NOT NULL as tiene_definicion
FROM information_schema.routines 
WHERE routine_name = 'process_filter_configs';

-- 4. Verificar configuraciones activas
SELECT '=== VERIFICAR CONFIGURACIONES ACTIVAS ===' as info;
SELECT 
    id,
    name,
    is_active,
    auto_process,
    last_used_at
FROM filter_configs 
WHERE is_active = true AND auto_process = true;

-- 5. Verificar últimos registros en duc_scraper
SELECT '=== ÚLTIMOS REGISTROS EN DUC_SCRAPER ===' as info;
SELECT 
    "ID Anuncio",
    "Matrícula",
    import_date,
    created_at
FROM duc_scraper 
ORDER BY created_at DESC
LIMIT 5;

-- 6. Verificar logs recientes
SELECT '=== LOGS RECIENTES ===' as info;
SELECT 
    level,
    message,
    timestamp
FROM scraper_logs 
ORDER BY timestamp DESC
LIMIT 10;

-- 7. Probar inserción manual para ver si el trigger funciona
SELECT '=== PRUEBA MANUAL DEL TRIGGER ===' as info;

-- Insertar un registro de prueba
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
    'MANUAL-TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'MANUAL' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'BMW X5',
    '3.0d xDrive',
    '15-01-2024',
    'Disponible',
    'BMW',
    '55000',
    '30000',
    'Diésel',
    'BMW Barcelona',
    'Sí',
    '2021',
    '45',
    'manual_test.csv'
);

-- 8. Verificar si se activó el trigger (logs)
SELECT '=== LOGS DESPUÉS DE LA INSERCIÓN ===' as info;
SELECT 
    level,
    message,
    timestamp
FROM scraper_logs 
WHERE timestamp > NOW() - INTERVAL '5 minutes'
ORDER BY timestamp DESC;

-- 9. Verificar si se procesó automáticamente
SELECT '=== VERIFICAR PROCESAMIENTO AUTOMÁTICO ===' as info;
SELECT 
    'Datos en duc_scraper' as tabla,
    COUNT(*) as total
FROM duc_scraper 
WHERE "ID Anuncio" LIKE 'MANUAL-TEST-%'
UNION ALL
SELECT 
    'Datos en nuevas_entradas' as tabla,
    COUNT(*) as total
FROM nuevas_entradas 
WHERE license_plate LIKE 'MANUAL%';

-- 10. Si no funcionó, recrear el trigger manualmente
SELECT '=== RECREAR TRIGGER MANUALMENTE ===' as info;

-- Recrear función del trigger con más logs
CREATE OR REPLACE FUNCTION auto_process_filters_on_duc_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Log detallado de activación
    INSERT INTO scraper_logs (level, message, timestamp) 
    VALUES ('info', '🔄 TRIGGER ACTIVADO - ID: ' || NEW."ID Anuncio" || ' - Matrícula: ' || COALESCE(NEW."Matrícula", 'N/A'), NOW());
    
    -- Verificar si hay configuraciones activas
    IF NOT EXISTS (SELECT 1 FROM filter_configs WHERE is_active = true AND auto_process = true) THEN
        INSERT INTO scraper_logs (level, message, timestamp) 
        VALUES ('warning', '⚠️ No hay configuraciones activas con auto_process = true', NOW());
        RETURN NEW;
    END IF;
    
    -- Procesar configuraciones
    INSERT INTO scraper_logs (level, message, timestamp) 
    VALUES ('info', '📋 Ejecutando process_filter_configs()...', NOW());
    
    PERFORM process_filter_configs();
    
    INSERT INTO scraper_logs (level, message, timestamp) 
    VALUES ('success', '✅ Trigger completado exitosamente', NOW());
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO scraper_logs (level, message, timestamp) 
    VALUES ('error', '❌ Error en trigger: ' || SQLERRM, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger
DROP TRIGGER IF EXISTS trigger_auto_process_filters ON duc_scraper;

CREATE TRIGGER trigger_auto_process_filters
    AFTER INSERT OR UPDATE ON duc_scraper
    FOR EACH ROW
    EXECUTE FUNCTION auto_process_filters_on_duc_update();

-- 11. Probar de nuevo
SELECT '=== PRUEBA FINAL ===' as info;
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
    'FINAL-TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'FINAL' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'Audi A4',
    '2.0 TDI',
    '20-01-2024',
    'Disponible',
    'Audi',
    '35000',
    '20000',
    'Diésel',
    'Audi Madrid',
    'Sí',
    '2023',
    '15',
    'final_test.csv'
);

-- 12. Verificar logs finales
SELECT '=== LOGS FINALES ===' as info;
SELECT 
    level,
    message,
    timestamp
FROM scraper_logs 
WHERE timestamp > NOW() - INTERVAL '2 minutes'
ORDER BY timestamp DESC;

-- 13. Limpiar datos de prueba
DELETE FROM nuevas_entradas WHERE license_plate LIKE 'MANUAL%' OR license_plate LIKE 'FINAL%';
DELETE FROM duc_scraper WHERE "ID Anuncio" LIKE 'MANUAL-TEST-%' OR "ID Anuncio" LIKE 'FINAL-TEST-%';

SELECT '=== DIAGNÓSTICO COMPLETADO ===' as info; 