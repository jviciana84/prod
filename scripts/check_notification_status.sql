-- Script para verificar el estado actual de las notificaciones
-- Ejecutar en Supabase SQL Editor

-- Obtener el ID del usuario viciana84@gmail.com
DO $$
DECLARE
    current_user_id UUID;
    prefs_count INTEGER;
    history_count INTEGER;
    subs_count INTEGER;
    types_count INTEGER;
BEGIN
    -- Obtener el ID del usuario
    SELECT id INTO current_user_id FROM auth.users WHERE email = 'viciana84@gmail.com';
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario viciana84@gmail.com no encontrado';
    END IF;
    
    -- Contar preferencias de notificación
    SELECT COUNT(*) INTO prefs_count FROM user_notification_preferences WHERE user_id = current_user_id;
    
    -- Contar notificaciones en historial
    SELECT COUNT(*) INTO history_count FROM notification_history WHERE user_id = current_user_id;
    
    -- Contar suscripciones push
    SELECT COUNT(*) INTO subs_count FROM user_push_subscriptions WHERE user_id = current_user_id;
    
    -- Contar tipos de notificaciones activos
    SELECT COUNT(*) INTO types_count FROM notification_types WHERE is_active = true;
    
    RAISE NOTICE '=== ESTADO DE NOTIFICACIONES ===';
    RAISE NOTICE 'Usuario: % (%)', current_user_id, 'viciana84@gmail.com';
    RAISE NOTICE 'Tipos de notificación activos: %', types_count;
    RAISE NOTICE 'Preferencias de usuario: %', prefs_count;
    RAISE NOTICE 'Notificaciones en historial: %', history_count;
    RAISE NOTICE 'Suscripciones push: %', subs_count;
    RAISE NOTICE '================================';
    
    -- Mostrar tipos de notificaciones
    RAISE NOTICE 'Tipos de notificación disponibles:';
    FOR rec IN SELECT name, description, category FROM notification_types WHERE is_active = true ORDER BY category, name
    LOOP
        RAISE NOTICE '- %: % (%)', rec.name, rec.description, rec.category;
    END LOOP;
    
    -- Mostrar preferencias del usuario
    RAISE NOTICE 'Preferencias del usuario:';
    FOR rec IN 
        SELECT nt.name, unp.is_enabled 
        FROM user_notification_preferences unp
        JOIN notification_types nt ON unp.notification_type_id = nt.id
        WHERE unp.user_id = current_user_id 
        ORDER BY nt.name
    LOOP
        RAISE NOTICE '- %: %', rec.name, CASE WHEN rec.is_enabled THEN 'HABILITADA' ELSE 'DESHABILITADA' END;
    END LOOP;
    
END $$; 