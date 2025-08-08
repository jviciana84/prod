-- SCRIPT: Prueba del trigger de notificaciones de ventas nuevas
-- =================================================================

-- PASO 1: Verificar que existe el trigger
SELECT 
    '🔍 Verificando trigger de nueva venta' as status,
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'sales_vehicles'
AND trigger_name = 'new_sale_notification_trigger';

-- PASO 2: Verificar que existe la función
SELECT 
    '🔍 Verificando función de nueva venta' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_sale_notification';

-- PASO 3: Verificar usuarios admin/supervisor/director disponibles
SELECT 
    '👥 Usuarios admin/supervisor/director disponibles:' as status,
    id,
    full_name,
    alias,
    role
FROM profiles 
WHERE role ILIKE 'admin' 
   OR role ILIKE 'supervisor' 
   OR role ILIKE 'director'
ORDER BY role, full_name;

-- PASO 4: Insertar venta de prueba (esto activará el trigger)
INSERT INTO sales_vehicles (
    license_plate, 
    model, 
    advisor, 
    sale_date, 
    sale_price,
    discount,
    client_name,
    created_at, 
    updated_at
) VALUES (
    'TEST' || EXTRACT(EPOCH FROM NOW())::TEXT, 
    'BMW X3 Test', 
    'JordiVi',
    NOW(), 
    45000,
    2000,
    'Cliente Prueba',
    NOW(), 
    NOW()
);

-- PASO 5: Verificar que se creó la notificación
SELECT 
    '✅ Verificando notificaciones creadas:' as status,
    nh.id,
    nh.title,
    nh.body,
    nh.created_at,
    p.full_name as recipient,
    p.role as recipient_role
FROM notification_history nh
JOIN profiles p ON nh.user_id = p.id
WHERE nh.data->>'category' = 'new_sale'
AND nh.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY nh.created_at DESC;

-- PASO 6: Limpiar datos de prueba (opcional)
-- DELETE FROM notification_history 
-- WHERE data->>'category' = 'new_sale' 
-- AND created_at >= NOW() - INTERVAL '5 minutes';
-- 
-- DELETE FROM sales_vehicles 
-- WHERE license_plate LIKE 'TEST%' 
-- AND created_at >= NOW() - INTERVAL '5 minutes';
