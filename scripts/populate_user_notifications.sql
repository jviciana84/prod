-- Script para poblar notificaciones solo para viciana84@gmail.com
-- Ejecutar en Supabase SQL Editor

-- Primero, insertar los tipos de notificaciones si no existen
INSERT INTO notification_types (name, description, category, is_active) 
VALUES
('fotografias_asignadas', 'Cuando se te asignan fotografías', 'tareas', true),
('material_entregado', 'Cuando se te entrega cualquier material', 'tareas', true),
('venta_360_finalizada', 'Venta 360 finalizada (solo asesor)', 'ventas', true),
('venta_cyp_finalizada', 'Venta CyP finalizada (solo asesor)', 'ventas', true),
('incidencia_registrada', 'Registro de incidencia (solo asesor)', 'incidencias', true),
('incidencia_solucionada', 'Solución de incidencia (solo asesor)', 'incidencias', true),
('venta_registrada', 'Registro de cualquier venta (admin/supervisor/director)', 'admin', true),
('venta_caida', 'Registro de venta caída (admin/supervisor/director)', 'admin', true)
ON CONFLICT (name) DO NOTHING;

-- Obtener el ID del usuario viciana84@gmail.com
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Obtener el ID del usuario
    SELECT id INTO current_user_id FROM auth.users WHERE email = 'viciana84@gmail.com';
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario viciana84@gmail.com no encontrado';
    END IF;
    
    -- Insertar preferencias de notificación para el usuario
    INSERT INTO user_notification_preferences (user_id, notification_type_id, is_enabled)
    SELECT current_user_id, nt.id, true
    FROM notification_types nt
    WHERE nt.is_active = true
    ON CONFLICT (user_id, notification_type_id) DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled;
    
    -- Crear algunas notificaciones de prueba en el historial
    INSERT INTO notification_history (user_id, title, body, data, created_at)
    VALUES
    (current_user_id, '🧪 Prueba de notificación', 'Esta es una notificación de prueba del sistema', '{"url": "/dashboard", "source": "test"}', NOW() - INTERVAL '1 hour'),
    (current_user_id, '📸 Fotografías asignadas', 'Se te han asignado 5 nuevas fotografías', '{"url": "/dashboard/fotografias", "source": "fotografias_asignadas"}', NOW() - INTERVAL '30 minutes'),
    (current_user_id, '📦 Material entregado', 'Se ha entregado material en tu zona', '{"url": "/dashboard/material", "source": "material_entregado"}', NOW() - INTERVAL '15 minutes');
    
    RAISE NOTICE 'Datos poblados correctamente para el usuario %', current_user_id;
END $$; 