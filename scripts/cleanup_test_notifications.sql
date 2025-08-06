-- Script para limpiar todos los datos de prueba de notificaciones
-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los datos de notificaciones
-- Ejecutar en Supabase SQL Editor

-- Obtener el ID del usuario viciana84@gmail.com
DO $$
DECLARE
    current_user_id UUID;
    deleted_count INTEGER := 0;
BEGIN
    -- Obtener el ID del usuario
    SELECT id INTO current_user_id FROM auth.users WHERE email = 'viciana84@gmail.com';
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario viciana84@gmail.com no encontrado';
    END IF;
    
    -- Eliminar preferencias de notificación del usuario
    DELETE FROM user_notification_preferences WHERE user_id = current_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminadas % preferencias de notificación', deleted_count;
    
    -- Eliminar suscripciones push del usuario
    DELETE FROM user_push_subscriptions WHERE user_id = current_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminadas % suscripciones push', deleted_count;
    
    -- Eliminar historial de notificaciones del usuario
    DELETE FROM notification_history WHERE user_id = current_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminadas % notificaciones del historial', deleted_count;
    
    RAISE NOTICE 'Limpieza completada para el usuario %', current_user_id;
END $$;

-- Opcional: Eliminar también los tipos de notificaciones de prueba
-- (Descomenta las siguientes líneas si quieres eliminar también los tipos)
/*
DELETE FROM notification_types WHERE name IN (
    'fotografias_asignadas',
    'material_entregado', 
    'venta_360_finalizada',
    'venta_cyp_finalizada',
    'incidencia_registrada',
    'incidencia_solucionada',
    'venta_registrada',
    'venta_caida'
);
*/ 