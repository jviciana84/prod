-- =====================================================
-- CREAR CONFIGURACIÓN ACTIVA CON AUTO_PROCESS
-- =====================================================

-- 1. Crear configuración activa
INSERT INTO filter_configs (
    name,
    description,
    is_active,
    auto_process,
    max_vehicles_per_batch
) VALUES (
    'Captura Automática BMW',
    'Configuración automática para capturar vehículos BMW',
    true,
    true,
    100
) ON CONFLICT DO NOTHING;

-- 2. Verificar que se creó
SELECT '=== CONFIGURACIÓN CREADA ===' as info;
SELECT 
    id,
    name,
    description,
    is_active,
    auto_process
FROM filter_configs 
WHERE name = 'Captura Automática BMW';

-- 3. Activar mapeos básicos si no están activos
UPDATE column_mappings 
SET is_active = true 
WHERE duc_scraper_column IN ('Matrícula', 'Modelo', 'Fecha compra DMS')
AND is_active = false;

-- 4. Verificar mapeos activos
SELECT '=== MAPEOS ACTIVOS ===' as info;
SELECT 
    id,
    name,
    duc_scraper_column,
    nuevas_entradas_column,
    is_active
FROM column_mappings 
WHERE is_active = true; 