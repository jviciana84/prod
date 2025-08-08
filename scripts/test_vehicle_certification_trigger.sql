-- SCRIPT: Probar el trigger de notificaciones de vehículos certificados
-- ===================================================================

-- PASO 1: Verificar que el trigger existe
SELECT 
    '🔍 VERIFICANDO TRIGGER' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'entregas'
AND trigger_name = 'vehicle_certified_notification_trigger';

-- PASO 2: Verificar que la función existe
SELECT 
    '🔍 VERIFICANDO FUNCIÓN' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_vehicle_certified_notification';

-- PASO 3: Probar con una inserción de prueba
INSERT INTO entregas (
    fecha_venta,
    fecha_entrega,
    matricula,
    modelo,
    asesor,
    "or",
    incidencia,
    observaciones,
    created_at,
    updated_at
) VALUES (
    NOW(),
    NULL,
    'TEST001',
    'BMW X3',
    'JordiVi',
    '12345',
    false,
    'Prueba de trigger de notificación',
    NOW(),
    NOW()
) ON CONFLICT (matricula) DO NOTHING;

-- PASO 4: Verificar que se creó la notificación
SELECT 
    '📧 NOTIFICACIONES CREADAS' as info,
    nh.id,
    nh.title,
    nh.body,
    nh.created_at,
    p.full_name as asesor
FROM notification_history nh
JOIN profiles p ON nh.user_id = p.id
WHERE nh.data->>'license_plate' = 'TEST001'
ORDER BY nh.created_at DESC
LIMIT 5;

-- PASO 5: Limpiar datos de prueba (opcional)
-- DELETE FROM notification_history WHERE data->>'license_plate' = 'TEST001';
-- DELETE FROM entregas WHERE matricula = 'TEST001';

-- PASO 6: Mostrar estadísticas
SELECT 
    '📊 ESTADÍSTICAS' as info,
    COUNT(*) as total_entregas,
    COUNT(CASE WHEN fecha_entrega IS NOT NULL THEN 1 END) as con_fecha_entrega,
    COUNT(CASE WHEN fecha_entrega IS NULL THEN 1 END) as sin_fecha_entrega
FROM entregas;

SELECT 
    '📊 NOTIFICACIONES' as info,
    COUNT(*) as total_notificaciones,
    COUNT(CASE WHEN title LIKE '%Vehículo Certificado%' THEN 1 END) as certificaciones,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as ultima_hora
FROM notification_history;
